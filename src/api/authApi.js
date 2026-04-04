import { kotlinFetch } from "./config.js";

function saveAccessToken(token) {
  if (!token || typeof sessionStorage === "undefined") return;
  sessionStorage.setItem("diasoft_access_token", token);
}

async function readErrorMessage(res) {
  const defaultByStatus = {
    400: "Проверьте корректность данных для входа.",
    401: "Неверный логин или пароль.",
    403: "Доступ запрещен.",
    404: "Сервис авторизации не найден.",
    429: "Слишком много попыток входа. Повторите позже.",
    500: "Внутренняя ошибка сервера. Повторите позже.",
  };

  try {
    const data = await res.json();
    if (typeof data?.error === "string" && data.error.trim()) {
      const raw = data.error.trim();
      if (/invalid credentials/i.test(raw)) return "Неверный логин или пароль.";
      if (/unsupported role/i.test(raw)) return "Выбрана неподдерживаемая роль.";
      if (/login and password are required/i.test(raw)) return "Введите логин и пароль.";
      return raw;
    }
  } catch {
    /* ignore */
  }
  return defaultByStatus[res.status] ?? `Ошибка авторизации (HTTP ${res.status}).`;
}

/**
 * @param {{ role: string, login: string, password: string }} credentials
 * @returns {Promise<{ role: string, login: string, fullName?: string, universityCode?: string, accessToken?: string }>}
 */
export async function login(credentials) {
  try {
    const res = await kotlinFetch("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      throw new Error(await readErrorMessage(res));
    }
    const data = await res.json();
    saveAccessToken(data.accessToken);
    return data;
  } catch (error) {
    if (error instanceof Error) {
      if (/failed to fetch|networkerror|load failed/i.test(error.message)) {
        throw new Error("Не удалось подключиться к серверу авторизации.");
      }
      throw error;
    }
    throw new Error("Ошибка авторизации.");
  }
}

export async function logout() {
  sessionStorage.removeItem("diasoft_access_token");
  return Promise.resolve();
}

export async function refreshSession() {
  return Promise.resolve({});
}

export async function requestPasswordReset(payload) {
  void payload;
  return Promise.resolve({});
}

export async function confirmPasswordReset(payload) {
  void payload;
  return Promise.resolve({});
}
