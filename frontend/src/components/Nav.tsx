import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";

function navLinkClasses(isActive: boolean): string {
  return `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-navy-700 text-white"
      : "text-navy-100 hover:bg-navy-800 hover:text-white"
  }`;
}

export default function Nav() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: "/chat", label: t.navChat, show: true },
    { to: "/documents", label: t.navDocuments, show: user?.role === "officer" || user?.role === "admin" },
    { to: "/admin", label: t.navAdmin, show: user?.role === "admin" },
  ].filter((l) => l.show);

  return (
    <header className="bg-navy-900 shadow-card">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Logo />
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{t.appName}</span>
              <span className="rounded bg-gold-400 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy-900">
                {t.poc}
              </span>
            </div>
            <div className="hidden text-xs text-navy-300 sm:block">{t.appTagline}</div>
          </div>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => navLinkClasses(isActive)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          {user && (
            <div className="flex items-center gap-2 border-l border-navy-700 pl-3">
              <span className="text-sm text-navy-200">{user.full_name}</span>
              <button
                type="button"
                onClick={logout}
                className="rounded-md px-2.5 py-1.5 text-sm font-medium text-navy-200 hover:bg-navy-800 hover:text-white"
              >
                {t.logout}
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          className="rounded-md p-2 text-navy-100 hover:bg-navy-800 md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-navy-800 px-4 pb-3 md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => navLinkClasses(isActive)}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-3 flex items-center justify-between">
            <LanguageSwitcher />
            {user && (
              <button
                type="button"
                onClick={logout}
                className="rounded-md px-2.5 py-1.5 text-sm font-medium text-navy-200 hover:bg-navy-800 hover:text-white"
              >
                {t.logout}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
