import uuid
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import client_ip, get_current_user, require_roles
from app.config import get_settings
from app.core.rbac import can_access
from app.database import get_db
from app.models import Classification, Document, DocumentStatus, Role, User
from app.rag.ingestion import ingest_document
from app.rag.vectorstore import delete_document_chunks
from app.schemas import DocumentOut, DocumentUploadResponse
from app.services.audit import log_action

router = APIRouter(prefix="/documents", tags=["documents"])
settings = get_settings()

ALLOWED_SUFFIXES = {".pdf", ".docx", ".txt", ".md"}


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    department_id: str | None = Form(None),
    classification: Classification = Form(Classification.public),
    title: str | None = Form(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(Role.officer, Role.admin)),
):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_SUFFIXES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unsupported file type: {suffix or 'unknown'}")

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    stored_name = f"{uuid.uuid4()}{suffix}"
    storage_path = upload_dir / stored_name

    size = 0
    max_bytes = settings.max_upload_mb * 1024 * 1024
    with open(storage_path, "wb") as out:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > max_bytes:
                out.close()
                storage_path.unlink(missing_ok=True)
                raise HTTPException(
                    status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, f"File exceeds {settings.max_upload_mb} MB limit"
                )
            out.write(chunk)

    document = Document(
        title=title or file.filename or stored_name,
        filename=file.filename or stored_name,
        storage_path=str(storage_path),
        department_id=department_id,
        classification=classification,
        status=DocumentStatus.processing,
        uploaded_by=user.id,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    log_action(
        db,
        user=user,
        action="upload_document",
        resource_type="document",
        resource_id=document.id,
        ip_address=client_ip(request),
        extra={"filename": document.filename, "classification": classification.value},
    )

    background_tasks.add_task(ingest_document, document.id)

    return DocumentUploadResponse(id=document.id, status=document.status)


@router.get("", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    documents = db.query(Document).order_by(Document.created_at.desc()).all()
    return [d for d in documents if can_access(user, d.department_id, d.classification)]


@router.get("/{document_id}", response_model=DocumentOut)
def get_document(document_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    document = db.get(Document, document_id)
    if document is None or not can_access(user, document.department_id, document.classification):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    return document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: str,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    if user.role != Role.admin and document.uploaded_by != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only an admin or the uploader can delete this document")

    delete_document_chunks(document.id)
    Path(document.storage_path).unlink(missing_ok=True)

    log_action(
        db,
        user=user,
        action="delete_document",
        resource_type="document",
        resource_id=document.id,
        ip_address=client_ip(request),
    )

    db.delete(document)
    db.commit()
