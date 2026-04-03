import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./LoginPage.jsx";
import UniversityLoginPage from "./pages/UniversityLoginPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login/vuz" element={<UniversityLoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
