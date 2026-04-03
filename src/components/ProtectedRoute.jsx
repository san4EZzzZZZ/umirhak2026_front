import { Navigate, useLocation } from "react-router-dom";
import { cabinetPathForRole, loginPathForRole } from "../auth/authPaths.js";
import { useAuth } from "../auth/AuthContext.jsx";

/** Защита маршрутов до появления guard на Kotlin (роли из JWT / session на бэкенде) */

export default function ProtectedRoute({ role, roles, children }) {
  const { user } = useAuth();
  const location = useLocation();
  const allowed = roles?.length ? roles : role ? [role] : [];

  if (!user) {
    return <Navigate to={loginPathForRole(allowed[0])} replace state={{ from: location.pathname }} />;
  }

  if (!allowed.includes(user.role)) {
    return <Navigate to={cabinetPathForRole(user.role)} replace />;
  }

  return children;
}
