/**
 * Базовый URL REST API бэкенда на Kotlin (Ktor / Spring WebFlux и т.п.).
 * После сборки сервера задайте в .env: VITE_API_BASE_URL=http://localhost:8080
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

/**
 * Заголовки для вызовов Kotlin-бэкенда. После внедрения JWT подставьте токен из хранилища сессии.
 */
export function kotlinApiHeaders() {
  // Kotlin: обычно Authorization: Bearer <accessToken> из ответа POST /api/v1/auth/login
  const token = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("diasoft_access_token") : null;
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Обёртка под fetch с единой точкой для логирования и замены на ktor-client / Retrofit */
export async function kotlinFetch(path, options = {}) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  // TODO Kotlin backend: раскомментировать при готовности API
  // return fetch(url, { ...options, headers: { ...kotlinApiHeaders(), ...options.headers } });
  void url;
  void options;
  return Promise.reject(new Error("Kotlin API: вызов отключён в заглушке (подключите fetch в src/api/config.js)"));
}
