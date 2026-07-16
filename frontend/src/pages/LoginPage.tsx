import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import { ApiError } from "../api/client";
import Logo from "../components/Logo";
import PocBadge from "../components/PocBadge";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function LoginPage() {
  const { user, initializing, login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!initializing && user) {
    const redirectTo = (location.state as { from?: string } | null)?.from || "/chat";
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/chat", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 400)) {
        setError(t.loginError);
      } else {
        setError(err instanceof Error ? err.message : t.error);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-navy-950">
      <div className="flex justify-end p-4">
        <LanguageSwitcher />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-16">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo className="h-14 w-14" />
          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-semibold text-white">{t.appName}</h1>
              <span className="rounded bg-gold-400 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-navy-900">
                {t.poc}
              </span>
            </div>
            <p className="mt-1 text-sm text-navy-300">{t.appTagline}</p>
          </div>
          <PocBadge />
        </div>

        <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-card">
          <h2 className="text-lg font-semibold text-navy-900">{t.loginTitle}</h2>
          <p className="mt-1 text-sm text-navy-500">{t.loginSubtitle}</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-navy-700">
                {t.emailLabel}
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm text-navy-900 shadow-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-navy-700">
                {t.passwordLabel}
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm text-navy-900 shadow-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-navy-700 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-navy-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? t.loginLoading : t.loginButton}
            </button>
          </form>
        </div>

        <p className="mt-6 max-w-sm text-center text-xs text-navy-400">
          {t.footerNote}
        </p>
      </div>
    </div>
  );
}
