import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types";
import { useI18n } from "../context/I18nContext";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, initializing } = useAuth();
  const { t } = useI18n();

  if (initializing) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-navy-400">
        {t.loading}
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/chat" replace />;
  }

  return <>{children}</>;
}
