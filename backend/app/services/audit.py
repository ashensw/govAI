from sqlalchemy.orm import Session

from app.models import AuditLog, User


def log_action(
    db: Session,
    *,
    user: User | None,
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    ip_address: str | None = None,
    extra: dict | None = None,
) -> None:
    """Every authentication event, document operation, and chat query is
    recorded here. This is the audit trail a government deployment needs for
    compliance review — who asked what, over which documents, and when."""
    entry = AuditLog(
        user_id=user.id if user else None,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        ip_address=ip_address,
        extra=extra,
    )
    db.add(entry)
    db.commit()
