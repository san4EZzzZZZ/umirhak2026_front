import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext.jsx";
import { ROLES } from "./auth/authPaths.js";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LoginPage from "./LoginPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import UniversityLoginPage from "./pages/UniversityLoginPage.jsx";
import EmployerCabinetPage from "./pages/cabinets/EmployerCabinetPage.jsx";
import StudentCabinetPage from "./pages/cabinets/StudentCabinetPage.jsx";
import UniversityCabinetPage from "./pages/cabinets/UniversityCabinetPage.jsx";
import UniversityDiplomaSignPage from "./pages/cabinets/UniversityDiplomaSignPage.jsx";
import AdminCabinetPage from "./pages/cabinets/AdminCabinetPage.jsx";
import SuperAdminCabinetPage from "./pages/cabinets/SuperAdminCabinetPage.jsx";
import AdminLoginPage from "./pages/AdminLoginPage.jsx";
import AdminForgotPasswordPage from "./pages/AdminForgotPasswordPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import UniversityForgotPasswordPage from "./pages/UniversityForgotPasswordPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/login/reset-password" element={<ResetPasswordPage />} />
          <Route path="/login/vuz" element={<UniversityLoginPage />} />
          <Route path="/login/vuz/forgot-password" element={<UniversityForgotPasswordPage />} />
          <Route path="/login/admin" element={<AdminLoginPage />} />
          <Route path="/login/admin/forgot-password" element={<AdminForgotPasswordPage />} />
          <Route
            path="/cabinet/vuz"
            element={
              <ProtectedRoute role={ROLES.university}>
                <Outlet />
              </ProtectedRoute>
            }
          >
            <Route index element={<UniversityCabinetPage />} />
            <Route path="sign-diploma" element={<UniversityDiplomaSignPage />} />
          </Route>
          <Route
            path="/cabinet/student"
            element={
              <ProtectedRoute role={ROLES.student}>
                <StudentCabinetPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cabinet/hr"
            element={
              <ProtectedRoute role={ROLES.employer}>
                <EmployerCabinetPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cabinet/admin"
            element={
              <ProtectedRoute roles={[ROLES.admin, ROLES.superadmin]}>
                <AdminCabinetPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cabinet/superadmin"
            element={
              <ProtectedRoute role={ROLES.superadmin}>
                <SuperAdminCabinetPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
