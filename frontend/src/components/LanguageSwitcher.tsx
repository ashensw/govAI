import { useI18n } from "../context/I18nContext";
import { LOCALE_LABELS, SUPPORTED_LOCALES } from "../i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center gap-1 rounded-full bg-navy-800/60 p-1 text-xs font-medium">
      {SUPPORTED_LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            locale === code
              ? "bg-gold-400 text-navy-900"
              : "text-navy-100 hover:bg-navy-700"
          }`}
        >
          {LOCALE_LABELS[code]}
        </button>
      ))}
    </div>
  );
}
