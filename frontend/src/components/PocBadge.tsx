import { useI18n } from "../context/I18nContext";

export default function PocBadge({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-gold-300 bg-gold-50 px-3 py-1 text-xs font-medium text-gold-800 ${className}`}
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.72-1.36 3.486 0l6.28 11.18c.75 1.334-.213 2.987-1.744 2.987H3.72c-1.53 0-2.493-1.653-1.744-2.987l6.28-11.18zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
      {t.pocDisclaimer}
    </span>
  );
}
