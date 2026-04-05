/**
 * Базовый URL REST API бэкенда на Kotlin (Ktor / Spring WebFlux и т.п.).
 * Для прода задайте в .env: VITE_API_BASE_URL=http://<VPS_IP>:8080
 * Если переменная не задана, берём текущий хост браузера и порт 8080.
 */
const envBaseUrl = import.meta.env.VITE_API_BASE_URL;
const fallbackBaseUrl =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8080`
    : "http://localhost:8080";

export const API_BASE_URL =
  typeof envBaseUrl === "string" && envBaseUrl.trim() ? envBaseUrl.trim() : fallbackBaseUrl;

function buildApiUrl(baseUrl, path) {
  const normalizedBase = String(baseUrl || "").trim().replace(/\/+$/, "");
  const normalizedPath = `/${String(path || "").replace(/^\/+/, "")}`;

  // Protect against misconfigured base like https://site.tld/api + path /api/v1/...
  if (normalizedBase.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${normalizedBase}${normalizedPath.slice(4)}`;
  }
  return `${normalizedBase}${normalizedPath}`;
}

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
  const url = buildApiUrl(API_BASE_URL, path);
  return fetch(url, { ...options, headers: { ...kotlinApiHeaders(), ...options.headers } });
}
