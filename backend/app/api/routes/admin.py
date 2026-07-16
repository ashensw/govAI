from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.database import get_db
from app.models import AuditLog, ChatSession, Department, Document, Role, User
from app.schemas import AdminStats, AuditLogOut, DepartmentStat

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_roles(Role.admin))])


@router.get("/audit-logs", response_model=list[AuditLogOut])
def audit_logs(limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    rows = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .offset(offset)
        .limit(min(limit, 200))
        .all()
    )
    return [
        AuditLogOut(
            id=r.id,
            user_email=r.user.email if r.user else None,
            action=r.action,
            resource_type=r.resource_type,
            resource_id=r.resource_id,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.get("/stats", response_model=AdminStats)
def stats(db: Session = Depends(get_db)):
    document_count = db.query(func.count(Document.id)).scalar() or 0
    user_count = db.query(func.count(User.id)).scalar() or 0
    chat_count = db.query(func.count(ChatSession.id)).scalar() or 0

    by_department_rows = (
        db.query(Department.id, Department.name_en, func.count(Document.id))
        .outerjoin(Document, Document.department_id == Department.id)
        .group_by(Department.id, Department.name_en)
        .all()
    )
    by_department = [
        DepartmentStat(department_id=dept_id, department_name=name, document_count=count)
        for dept_id, name, count in by_department_rows
    ]

    unassigned_count = db.query(func.count(Document.id)).filter(Document.department_id.is_(None)).scalar() or 0
    if unassigned_count:
        by_department.append(
            DepartmentStat(department_id=None, department_name="Unassigned / Public", document_count=unassigned_count)
        )

    return AdminStats(
        document_count=document_count,
        user_count=user_count,
        chat_count=chat_count,
        by_department=by_department,
    )
