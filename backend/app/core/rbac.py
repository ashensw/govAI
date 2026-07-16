"""Central access-control rules shared by the document API and the RAG
retrieval filter, so a user can never retrieve (via chat) something they
would not be allowed to see (via the document list).

Classification levels, from least to most sensitive:
  public        -> visible to every authenticated user
  restricted    -> visible to admins, and to any user in the owning department
  confidential  -> visible to admins, and to officers/admins in the owning department
                   (department viewers cannot see confidential material)
"""

from app.models import Classification, Role, User


def can_access(user: User, department_id: str | None, classification: Classification) -> bool:
    if user.role == Role.admin:
        return True

    if classification == Classification.public:
        return True

    same_department = department_id is not None and department_id == user.department_id

    if classification == Classification.restricted:
        return same_department

    if classification == Classification.confidential:
        return same_department and user.role == Role.officer

    return False
