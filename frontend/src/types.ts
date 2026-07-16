// Domain types mirroring the GovAI backend API contract.

export type UserRole = "admin" | "officer" | "viewer";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department_id: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Department {
  id: string;
  name_en: string;
  name_si: string;
  name_ta: string;
}

export type Classification = "public" | "restricted" | "confidential";

export type DocumentStatus = "processing" | "ready" | "failed";

export interface GovDocument {
  id: string;
  title: string;
  filename: string;
  department_id: string | null;
  classification: Classification;
  status: DocumentStatus;
  language: string | null;
  page_count: number | null;
  chunk_count: number | null;
  error_message: string | null;
  created_at: string;
  uploaded_by: string | null;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export type MessageRole = "user" | "assistant";

export interface Citation {
  document_id: string;
  title: string;
  chunk_text: string;
  page: number | null;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  citations: Citation[] | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  user_email: string;
  action: string;
  resource_type: string;
  resource_id: string;
  created_at: string;
}

export interface DepartmentStat {
  department_id: string;
  department_name: string;
  document_count: number;
}

export interface AdminStats {
  document_count: number;
  user_count: number;
  chat_count: number;
  by_department: DepartmentStat[];
}

export interface HealthStatus {
  status: string;
  qdrant: string;
  postgres: string;
  llm_provider: string;
}
