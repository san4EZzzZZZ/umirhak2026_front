import { Navigate, useLocation } from "react-router-dom";
import { cabinetPathForRole, loginPathForRole } from "../auth/authPaths.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function ProtectedRoute({ role, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to={loginPathForRole(role)} replace state={{ from: location.pathname }} />;
  }

  if (user.role !== role) {
    return <Navigate to={cabinetPathForRole(user.role)} replace />;
  }

  return children;
}
