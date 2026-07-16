import { useI18n } from "../context/I18nContext";

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-navy-100 bg-white px-4 py-2.5 text-center text-xs text-navy-400">
      {t.appName} &middot; {t.footerNote}
    </footer>
  );
}
