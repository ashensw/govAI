from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.rag.vectorstore import get_client
from app.schemas import HealthOut

router = APIRouter(tags=["health"])
settings = get_settings()


@router.get("/health", response_model=HealthOut)
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        postgres_status = "ok"
    except Exception:  # noqa: BLE001
        postgres_status = "unreachable"

    try:
        get_client().get_collections()
        qdrant_status = "ok"
    except Exception:  # noqa: BLE001
        qdrant_status = "unreachable"

    overall = "ok" if postgres_status == "ok" and qdrant_status == "ok" else "degraded"

    return HealthOut(
        status=overall,
        postgres=postgres_status,
        qdrant=qdrant_status,
        llm_provider=settings.llm_provider,
    )
