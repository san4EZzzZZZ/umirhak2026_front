/**
 * Авторизация — контракт для Kotlin-бэкенда.
 *
 * Рекомендуемые маршруты (пример):
 * - POST /api/v1/auth/login        — тело { role?, login, password }
 * - POST /api/v1/auth/refresh      — { refreshToken }
 * - POST /api/v1/auth/logout       — заголовок Authorization
 */

import { API_BASE_URL, kotlinApiHeaders } from "./config.js";

/**
 * @param {{ role: string, login: string, password: string }} credentials
 * @returns {Promise<{ accessToken?: string, refreshToken?: string }>}
 */
export async function login(credentials) {
  // Kotlin: POST /api/v1/auth/login
  // const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
  //   method: "POST",
  //   headers: kotlinApiHeaders(),
  //   body: JSON.stringify(credentials),
  // });
  // if (!res.ok) throw new Error(await res.text());
  // const data = await res.json();
  // sessionStorage.setItem("diasoft_access_token", data.accessToken);
  void API_BASE_URL;
  void kotlinApiHeaders;
  void credentials;
  return Promise.resolve({});
}

/** Сохранить сессию на сервере / инвалидировать refresh-токен */
export async function logout() {
  // Kotlin: POST /api/v1/auth/logout
  // await fetch(`${API_BASE_URL}/api/v1/auth/logout`, { method: "POST", headers: kotlinApiHeaders() });
  sessionStorage.removeItem("diasoft_access_token");
  return Promise.resolve();
}

/** Продление access-токена */
export async function refreshSession() {
  // Kotlin: POST /api/v1/auth/refresh
  return Promise.resolve({});
}

/**
 * Запрос письма со ссылкой на сброс пароля.
 * @param {{ role: string, email: string }} payload
 */
export async function requestPasswordReset(payload) {
  // Kotlin: POST /api/v1/auth/forgot-password — { role, email }
  void API_BASE_URL;
  void kotlinApiHeaders;
  void payload;
  return Promise.resolve({});
}

/**
 * Установка нового пароля по одноразовому токену из письма.
 * @param {{ token: string, newPassword: string }} payload
 */
export async function confirmPasswordReset(payload) {
  // Kotlin: POST /api/v1/auth/reset-password — { token, newPassword }
  void API_BASE_URL;
  void kotlinApiHeaders;
  void payload;
  return Promise.resolve({});
}
