import { api } from "./client";
import type { AdminStats, AuditLogEntry } from "../types";

export function fetchAdminStats(): Promise<AdminStats> {
  return api.get<AdminStats>("/admin/stats");
}

export function fetchAuditLogs(limit: number, offset: number): Promise<AuditLogEntry[]> {
  return api.get<AuditLogEntry[]>(`/admin/audit-logs?limit=${limit}&offset=${offset}`);
}
