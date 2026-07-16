"""End-to-end ingestion: parse -> detect language -> chunk -> embed -> store.

Runs as a FastAPI BackgroundTask after the upload endpoint returns, so large
PDFs don't block the HTTP response. For a real deployment beyond PoC scale,
swap this for a proper task queue (Celery/RQ/Arq) — noted in ARCHITECTURE.md.
"""

import logging

from app.database import SessionLocal
from app.models import Document, DocumentStatus
from app.rag.chunking import chunk_pages
from app.rag.language import detect_language
from app.rag.parsing import parse_document
from app.rag.vectorstore import delete_document_chunks, ensure_collection, upsert_chunks

logger = logging.getLogger(__name__)


def ingest_document(document_id: str) -> None:
    db = SessionLocal()
    try:
        document = db.get(Document, document_id)
        if document is None:
            logger.error("ingest_document: document %s not found", document_id)
            return

        try:
            ensure_collection()
            pages = parse_document(document.storage_path, document.filename)
            full_text = "\n".join(text for _, text in pages)
            language = detect_language(full_text)
            chunks = chunk_pages(pages)

            delete_document_chunks(document.id)  # idempotent on re-ingest
            chunk_count = upsert_chunks(
                document_id=document.id,
                title=document.title,
                department_id=document.department_id,
                classification=document.classification,
                language=language,
                chunks=chunks,
            )

            document.language = language
            document.page_count = len(pages)
            document.chunk_count = chunk_count
            document.status = DocumentStatus.ready if chunk_count > 0 else DocumentStatus.failed
            if chunk_count == 0:
                document.error_message = "No extractable text found (empty, corrupt, or unsupported scan quality)."
        except Exception as exc:  # noqa: BLE001 - surface any failure on the document row
            logger.exception("Ingestion failed for document %s", document_id)
            document.status = DocumentStatus.failed
            document.error_message = str(exc)[:1000]

        db.add(document)
        db.commit()
    finally:
        db.close()
