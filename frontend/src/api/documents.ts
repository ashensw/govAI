import { api, apiUrl, authHeaders, ApiError } from "./client";
import type { Classification, GovDocument } from "../types";

export function fetchDocuments(): Promise<GovDocument[]> {
  return api.get<GovDocument[]>("/documents");
}

export function fetchDocument(id: string): Promise<GovDocument> {
  return api.get<GovDocument>(`/documents/${id}`);
}

export function deleteDocument(id: string): Promise<void> {
  return api.delete<void>(`/documents/${id}`);
}

export interface UploadDocumentParams {
  file: File;
  departmentId: string;
  classification: Classification;
  title?: string;
}

export async function uploadDocument(
  params: UploadDocumentParams,
): Promise<{ id: string; status: string }> {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("department_id", params.departmentId);
  formData.append("classification", params.classification);
  if (params.title) formData.append("title", params.title);

  const res = await fetch(apiUrl("/documents/upload"), {
    method: "POST",
    headers: { ...authHeaders() },
    body: formData,
  });

  if (!res.ok) {
    let errBody: unknown;
    try {
      errBody = await res.json();
    } catch {
      // ignore
    }
    const message =
      (errBody as { detail?: string } | undefined)?.detail ||
      `Upload failed with status ${res.status}`;
    throw new ApiError(message, res.status, errBody);
  }

  return res.json();
}
