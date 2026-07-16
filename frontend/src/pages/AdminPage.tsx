import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../context/I18nContext";
import { fetchAdminStats, fetchAuditLogs } from "../api/admin";
import type { AdminStats, AuditLogEntry } from "../types";

const PAGE_SIZE = 20;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-navy-900">{value.toLocaleString()}</p>
    </div>
  );
}

export default function AdminPage() {
  const { t } = useI18n();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    setStatsLoading(true);
    fetchAdminStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    setLogsLoading(true);
    fetchAuditLogs(PAGE_SIZE, offset)
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLogsLoading(false));
  }, [offset]);

  const maxDeptCount = useMemo(() => {
    if (!stats || stats.by_department.length === 0) return 1;
    return Math.max(...stats.by_department.map((d) => d.document_count), 1);
  }, [stats]);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <h1 className="text-xl font-semibold text-navy-900">{t.adminTitle}</h1>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={t.adminStatDocuments} value={stats?.document_count ?? 0} />
        <StatCard label={t.adminStatUsers} value={stats?.user_count ?? 0} />
        <StatCard label={t.adminStatChats} value={stats?.chat_count ?? 0} />
      </div>

      <section className="mt-6 rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="text-sm font-semibold text-navy-800">{t.adminByDepartment}</h2>
        <div className="mt-4 space-y-3">
          {statsLoading ? (
            <p className="text-sm text-navy-400">{t.loading}</p>
          ) : !stats || stats.by_department.length === 0 ? (
            <p className="text-sm text-navy-400">{t.documentsEmpty}</p>
          ) : (
            stats.by_department.map((dep) => (
              <div key={dep.department_id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-navy-700">{dep.department_name}</span>
                  <span className="font-medium text-navy-500">{dep.document_count}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-navy-50">
                  <div
                    className="h-full rounded-full bg-gold-400"
                    style={{ width: `${(dep.document_count / maxDeptCount) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-navy-100 bg-white shadow-card">
        <div className="border-b border-navy-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-navy-800">{t.adminAuditLog}</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
                <th className="px-5 py-2.5 font-medium">{t.adminAuditTimestamp}</th>
                <th className="px-5 py-2.5 font-medium">{t.adminAuditUser}</th>
                <th className="px-5 py-2.5 font-medium">{t.adminAuditAction}</th>
                <th className="px-5 py-2.5 font-medium">{t.adminAuditResource}</th>
              </tr>
            </thead>
            <tbody>
              {logsLoading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-navy-400">
                    {t.loading}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-navy-400">
                    {t.adminEmptyAudit}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-navy-50 last:border-0">
                    <td className="px-5 py-3 text-navy-600">{formatDate(log.created_at)}</td>
                    <td className="px-5 py-3 text-navy-600">{log.user_email}</td>
                    <td className="px-5 py-3 font-medium text-navy-800">{log.action}</td>
                    <td className="px-5 py-3 text-navy-600">
                      {log.resource_type} · {log.resource_id}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-navy-100 px-5 py-3">
          <button
            type="button"
            disabled={offset === 0}
            onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
            className="rounded-md border border-navy-200 px-3 py-1.5 text-sm font-medium text-navy-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.adminPrev}
          </button>
          <button
            type="button"
            disabled={logs.length < PAGE_SIZE}
            onClick={() => setOffset((o) => o + PAGE_SIZE)}
            className="rounded-md border border-navy-200 px-3 py-1.5 text-sm font-medium text-navy-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.adminNext}
          </button>
        </div>
      </section>
    </div>
  );
}
