import { useI18n } from "../context/I18nContext";
import type { Classification, DocumentStatus } from "../types";

const CLASSIFICATION_STYLES: Record<Classification, string> = {
  public: "bg-emerald-50 text-emerald-700 border-emerald-200",
  restricted: "bg-amber-50 text-amber-800 border-amber-200",
  confidential: "bg-rose-50 text-rose-700 border-rose-200",
};

export function ClassificationBadge({ value }: { value: Classification }) {
  const { t } = useI18n();
  const labels: Record<Classification, string> = {
    public: t.classificationPublic,
    restricted: t.classificationRestricted,
    confidential: t.classificationConfidential,
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${CLASSIFICATION_STYLES[value]}`}
    >
      {labels[value]}
    </span>
  );
}

export function StatusBadge({ value }: { value: DocumentStatus }) {
  const { t } = useI18n();
  const labels: Record<DocumentStatus, string> = {
    processing: t.documentsStatusProcessing,
    ready: t.documentsStatusReady,
    failed: t.documentsStatusFailed,
  };

  if (value === "processing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        {labels[value]}
      </span>
    );
  }

  const styles: Record<Exclude<DocumentStatus, "processing">, string> = {
    ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
    failed: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        styles[value as Exclude<DocumentStatus, "processing">]
      }`}
    >
      {labels[value]}
    </span>
  );
}
