import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import { fetchDepartments } from "../api/departments";
import { deleteDocument, fetchDocuments, uploadDocument } from "../api/documents";
import { ClassificationBadge, StatusBadge } from "../components/Badges";
import type { Classification, Department, GovDocument } from "../types";

const POLL_INTERVAL_MS = 4000;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const docFilter = searchParams.get("doc");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [documents, setDocuments] = useState<GovDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [departmentId, setDepartmentId] = useState("");
  const [classification, setClassification] = useState<Classification>("public");
  const [title, setTitle] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadDocuments = useCallback(() => {
    return fetchDocuments()
      .then(setDocuments)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    fetchDepartments()
      .then((list) => {
        setDepartments(list);
        if (list.length > 0) setDepartmentId((prev) => prev || list[0].id);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setDocsLoading(true);
    loadDocuments().finally(() => setDocsLoading(false));
  }, [loadDocuments]);

  const hasProcessing = useMemo(
    () => documents.some((d) => d.status === "processing"),
    [documents],
  );

  useEffect(() => {
    if (!hasProcessing) return;
    const interval = setInterval(() => {
      loadDocuments();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [hasProcessing, loadDocuments]);

  const departmentName = useCallback(
    (id: string | null) => {
      if (!id) return t.documentsAllDepartments;
      return departments.find((d) => d.id === id)?.name_en || id;
    },
    [departments, t.documentsAllDepartments],
  );

  function resetUploadForm() {
    setFile(null);
    setTitle("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (!file || !departmentId) return;
    setUploading(true);
    setUploadError(null);
    try {
      await uploadDocument({ file, departmentId, classification, title: title || undefined });
      resetUploadForm();
      await loadDocuments();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t.error);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  }

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t.documentsDeleteConfirm)) return;
    const previous = documents;
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    try {
      await deleteDocument(id);
    } catch {
      setDocuments(previous);
    }
  }

  function clearFilter() {
    searchParams.delete("doc");
    setSearchParams(searchParams);
  }

  const canDelete = (doc: GovDocument) =>
    user?.role === "admin" || (user ? doc.uploaded_by === user.id : false);

  const visibleDocuments = docFilter ? documents.filter((d) => d.id === docFilter) : documents;

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <h1 className="text-xl font-semibold text-navy-900">{t.documentsTitle}</h1>

      <section className="mt-4 rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="text-sm font-semibold text-navy-800">{t.documentsUploadTitle}</h2>

        <form onSubmit={handleUpload} className="mt-4 space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
              dragActive ? "border-navy-500 bg-navy-50" : "border-navy-200 bg-slate-50"
            }`}
          >
            <svg viewBox="0 0 24 24" className="mb-2 h-8 w-8 text-navy-400" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 16.5v1.75A2.75 2.75 0 005.75 21h12.5A2.75 2.75 0 0021 18.25V16.5M7.5 8.25L12 3.75m0 0l4.5 4.5M12 3.75v12"
              />
            </svg>
            <p className="text-sm text-navy-600">
              {t.documentsDropHint}{" "}
              <span className="font-medium text-navy-700 underline">{t.documentsBrowse}</span>
            </p>
            {file && <p className="mt-2 text-xs font-medium text-navy-700">{file.name}</p>}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileInput}
              accept=".pdf,.doc,.docx,.txt,.md"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-navy-700">
                {t.documentsDepartment}
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm text-navy-900 shadow-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              >
                {departments.length === 0 && <option value="">—</option>}
                {departments.map((dep) => (
                  <option key={dep.id} value={dep.id}>
                    {dep.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700">
                {t.documentsClassification}
              </label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value as Classification)}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm text-navy-900 shadow-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              >
                <option value="public">{t.classificationPublic}</option>
                <option value="restricted">{t.classificationRestricted}</option>
                <option value="confidential">{t.classificationConfidential}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700">
                {t.documentsTitleField}{" "}
                <span className="font-normal text-navy-400">({t.documentsTitleOptional})</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm text-navy-900 shadow-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>
          </div>

          {uploadError && (
            <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {uploadError}
            </p>
          )}

          <button
            type="submit"
            disabled={!file || !departmentId || uploading}
            className="rounded-md bg-navy-700 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-navy-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? t.documentsUploading : t.documentsUploadButton}
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-xl border border-navy-100 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-navy-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-navy-800">{t.documentsTableTitle}</h2>
          {docFilter && (
            <button
              type="button"
              onClick={clearFilter}
              className="text-xs font-medium text-navy-500 hover:text-navy-700 hover:underline"
            >
              &times; {docFilter}
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
                <th className="px-5 py-2.5 font-medium">{t.documentsTableTitle}</th>
                <th className="px-5 py-2.5 font-medium">{t.documentsTableDepartment}</th>
                <th className="px-5 py-2.5 font-medium">{t.documentsTableClassification}</th>
                <th className="px-5 py-2.5 font-medium">{t.documentsTableStatus}</th>
                <th className="px-5 py-2.5 font-medium">{t.documentsTableLanguage}</th>
                <th className="px-5 py-2.5 font-medium">{t.documentsTablePages}</th>
                <th className="px-5 py-2.5 font-medium">{t.documentsTableUploaded}</th>
                <th className="px-5 py-2.5 font-medium">{t.documentsTableActions}</th>
              </tr>
            </thead>
            <tbody>
              {docsLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-6 text-center text-navy-400">
                    {t.loading}
                  </td>
                </tr>
              ) : visibleDocuments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-6 text-center text-navy-400">
                    {t.documentsEmpty}
                  </td>
                </tr>
              ) : (
                visibleDocuments.map((doc) => (
                  <tr key={doc.id} className="border-b border-navy-50 last:border-0">
                    <td className="px-5 py-3">
                      <div className="font-medium text-navy-800">{doc.title || doc.filename}</div>
                      <div className="text-xs text-navy-400">{doc.filename}</div>
                    </td>
                    <td className="px-5 py-3 text-navy-600">{departmentName(doc.department_id)}</td>
                    <td className="px-5 py-3">
                      <ClassificationBadge value={doc.classification} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge value={doc.status} />
                    </td>
                    <td className="px-5 py-3 text-navy-600">{doc.language || "—"}</td>
                    <td className="px-5 py-3 text-navy-600">{doc.page_count ?? "—"}</td>
                    <td className="px-5 py-3 text-navy-600">{formatDate(doc.created_at)}</td>
                    <td className="px-5 py-3">
                      {canDelete(doc) && (
                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id)}
                          className="text-xs font-medium text-rose-600 hover:underline"
                        >
                          {t.documentsDelete}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
