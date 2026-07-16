from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models import Classification, DocumentStatus, MessageRole, Role

# Login identifiers are plain strings rather than pydantic's EmailStr: the
# email-validator backend rejects reserved/special-use TLDs (.local,
# .example, .test, ...) even for pure syntax checks, which would lock out
# demo/internal accounts on those domains. Format isn't security-relevant
# here — the database lookup is what actually matters.


# ---------- Auth ----------


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: Role
    department_id: str | None = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UserCreateRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: Role = Role.viewer
    department_id: str | None = None


# ---------- Departments ----------


class DepartmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name_en: str
    name_si: str
    name_ta: str


# ---------- Documents ----------


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    filename: str
    department_id: str | None
    classification: Classification
    status: DocumentStatus
    language: str | None
    page_count: int | None
    chunk_count: int | None
    error_message: str | None = None
    uploaded_by: str | None
    created_at: datetime


class DocumentUploadResponse(BaseModel):
    id: str
    status: DocumentStatus


# ---------- Chat ----------


class ChatSessionCreate(BaseModel):
    title: str | None = None


class ChatSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    created_at: datetime
    updated_at: datetime


class Citation(BaseModel):
    document_id: str
    title: str
    chunk_text: str
    page: int | None = None
    score: float


class ChatMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    role: MessageRole
    content: str
    citations: list[Citation] | None = None
    created_at: datetime


class ChatMessageCreate(BaseModel):
    content: str


# ---------- Admin ----------


class AuditLogOut(BaseModel):
    id: str
    user_email: str | None
    action: str
    resource_type: str
    resource_id: str | None
    created_at: datetime


class DepartmentStat(BaseModel):
    department_id: str | None
    department_name: str
    document_count: int


class AdminStats(BaseModel):
    document_count: int
    user_count: int
    chat_count: int
    by_department: list[DepartmentStat]


# ---------- Health ----------


class HealthOut(BaseModel):
    status: str
    postgres: str
    qdrant: str
    llm_provider: str
