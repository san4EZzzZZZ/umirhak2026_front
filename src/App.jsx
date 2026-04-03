import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext.jsx";
import { ROLES } from "./auth/authPaths.js";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LoginPage from "./LoginPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import UniversityLoginPage from "./pages/UniversityLoginPage.jsx";
import EmployerCabinetPage from "./pages/cabinets/EmployerCabinetPage.jsx";
import StudentCabinetPage from "./pages/cabinets/StudentCabinetPage.jsx";
import UniversityCabinetPage from "./pages/cabinets/UniversityCabinetPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/vuz" element={<UniversityLoginPage />} />
          <Route
            path="/cabinet/vuz"
            element={
              <ProtectedRoute role={ROLES.university}>
                <UniversityCabinetPage />
              </ProtectedRoute>
            }
          />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
