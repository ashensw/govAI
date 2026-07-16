"""Idempotent startup seeding: a handful of fictional departments and one
demo account per role (admin/officer/viewer), so the RBAC story is
demonstrable immediately without building a user-management UI for a PoC.

All seeded accounts are clearly fictional/demo — change or remove them
before anything resembling a production deployment.
"""

import logging

from app.config import get_settings
from app.core.security import hash_password
from app.database import SessionLocal
from app.models import Department, Role, User

logger = logging.getLogger(__name__)
settings = get_settings()

DEPARTMENTS = [
    {
        "name_en": "Ministry of Public Administration (Demo)",
        "name_si": "රාජ්‍ය පරිපාලන අමාත්‍යාංශය (නිරූපණය)",
        "name_ta": "பொது நிர்வாக அமைச்சு (டெமோ)",
    },
    {
        "name_en": "Ministry of Health (Demo)",
        "name_si": "සෞඛ්‍ය අමාත්‍යාංශය (නිරූපණය)",
        "name_ta": "சுகாதார அமைச்சு (டெமோ)",
    },
    {
        "name_en": "Ministry of Finance (Demo)",
        "name_si": "මුදල් අමාත්‍යාංශය (නිරූපණය)",
        "name_ta": "நிதி அமைச்சு (டெமோ)",
    },
    {
        "name_en": "Department of Information Technology (Demo)",
        "name_si": "තොරතුරු තාක්ෂණ දෙපාර්තමේන්තුව (නිරූපණය)",
        "name_ta": "தகவல் தொழில்நுட்பத் திணைக்களம் (டெமோ)",
    },
]

DEMO_USERS = [
    # (email, password, role, department_name_en or None, full_name)
    (lambda s: s.seed_admin_email, lambda s: s.seed_admin_password, Role.admin, None, "Demo Administrator"),
    (lambda _s: "officer@govai.local", lambda _s: "Officer123!", Role.officer, "Ministry of Health (Demo)", "Demo Officer"),
    (lambda _s: "viewer@govai.local", lambda _s: "Viewer123!", Role.viewer, "Ministry of Health (Demo)", "Demo Viewer"),
]


def seed_initial_data() -> None:
    db = SessionLocal()
    try:
        name_to_department: dict[str, Department] = {}
        for dept in DEPARTMENTS:
            existing = db.query(Department).filter(Department.name_en == dept["name_en"]).first()
            if existing is None:
                existing = Department(**dept)
                db.add(existing)
                db.flush()
                logger.info("Seeded department: %s", dept["name_en"])
            name_to_department[dept["name_en"]] = existing
        db.commit()

        for email_fn, password_fn, role, dept_name, full_name in DEMO_USERS:
            email = email_fn(settings)
            if db.query(User).filter(User.email == email).first():
                continue
            department = name_to_department.get(dept_name) if dept_name else None
            db.add(
                User(
                    email=email,
                    hashed_password=hash_password(password_fn(settings)),
                    full_name=full_name,
                    role=role,
                    department_id=department.id if department else None,
                )
            )
            logger.info("Seeded demo user: %s (%s)", email, role.value)
        db.commit()
    finally:
        db.close()
