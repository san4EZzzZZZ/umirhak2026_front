import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./auth.css";
/* REST-заглушки под Kotlin: каталог src/api/ (см. src/api/index.js) */

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
