"""One-off script that ingests the synthetic demo documents shipped under
data/seed_documents/ so a fresh deployment has content to chat over
immediately.

Run inside the backend container (after `docker compose up`):

    docker compose exec backend python -m scripts.seed_documents

Safe to re-run: existing seed documents (matched by filename + language) are
skipped rather than duplicated.
"""

import logging
import shutil
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import get_settings  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models import Classification, Department, Document, DocumentStatus  # noqa: E402
from app.rag.ingestion import ingest_document  # noqa: E402
from app.rag.vectorstore import ensure_collection  # noqa: E402
from app.seed import seed_initial_data  # noqa: E402

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
settings = get_settings()

# filename (without extension) -> (title, classification, department_name_en | None)
DOCUMENT_PLAN = {
    "circular-public-holidays": (
        "Public Holiday Circular 2026",
        Classification.public,
        None,
    ),
    "advisory-public-health-guidance": (
        "Seasonal Dengue Prevention Advisory",
        Classification.public,
        "Ministry of Health (Demo)",
    ),
    "circular-hr-leave-policy": (
        "HR Circular: Leave Entitlements & Procedure",
        Classification.restricted,
        "Ministry of Public Administration (Demo)",
    ),
    "circular-procurement-guidelines": (
        "Procurement & Tendering Guidelines",
        Classification.restricted,
        "Ministry of Finance (Demo)",
    ),
    "policy-it-data-security": (
        "IT & Data Security Policy",
        Classification.confidential,
        "Department of Information Technology (Demo)",
    ),
}

LANGUAGES = {"en": "English", "si": "Sinhala", "ta": "Tamil"}

DATA_DIR_CANDIDATES = [
    Path("/app/data/seed_documents"),
    Path(__file__).resolve().parent.parent.parent / "data" / "seed_documents",
]


def _find_data_dir() -> Path:
    for candidate in DATA_DIR_CANDIDATES:
        if candidate.exists():
            return candidate
    raise FileNotFoundError(
        "Could not find data/seed_documents. Checked: " + ", ".join(str(c) for c in DATA_DIR_CANDIDATES)
    )


def main() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_collection()
    seed_initial_data()

    data_dir = _find_data_dir()
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    db = SessionLocal()
    try:
        departments = {d.name_en: d for d in db.query(Department).all()}

        for lang_code in LANGUAGES:
            lang_dir = data_dir / lang_code
            if not lang_dir.exists():
                logger.warning("No %s seed documents found at %s, skipping", lang_code, lang_dir)
                continue

            for stem, (title, classification, dept_name) in DOCUMENT_PLAN.items():
                source = lang_dir / f"{stem}.txt"
                if not source.exists():
                    logger.warning("Expected seed file missing: %s", source)
                    continue

                filename = f"{stem}.{lang_code}.txt"
                already_exists = db.query(Document).filter(Document.filename == filename).first()
                if already_exists:
                    logger.info("Skipping already-seeded document: %s", filename)
                    continue

                stored_path = upload_dir / f"{uuid.uuid4()}.txt"
                shutil.copyfile(source, stored_path)

                department = departments.get(dept_name) if dept_name else None
                document = Document(
                    title=f"{title} ({LANGUAGES[lang_code]})",
                    filename=filename,
                    storage_path=str(stored_path),
                    department_id=department.id if department else None,
                    classification=classification,
                    status=DocumentStatus.processing,
                    uploaded_by=None,
                )
                db.add(document)
                db.commit()
                db.refresh(document)

                logger.info("Ingesting %s ...", filename)
                ingest_document(document.id)

        logger.info("Seed document ingestion complete.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
