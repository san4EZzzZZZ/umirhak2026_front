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
      if (/already exists/i.test(raw) || /уже существует/i.test(raw)) return "Аккаунт с таким email уже существует.";
      if (/пароли не совпадают/i.test(raw) || /passwords do not match/i.test(raw)) return "Пароли не совпадают.";
      if (/только английские буквы/i.test(raw) || /only english letters/i.test(raw))
        return "В пароле разрешены только латинские буквы.";
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

async function registerByRole(role, payload) {
  const endpoint = role === "student" ? "/api/v1/students/register" : "/api/v1/hr/register";
  try {
    const res = await kotlinFetch(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await readErrorMessage(res));
    }
    return res.json();
  } catch (error) {
    if (error instanceof Error) {
      if (/failed to fetch|networkerror|load failed/i.test(error.message)) {
        throw new Error("Не удалось подключиться к серверу авторизации.");
      }
      throw error;
    }
    throw new Error("Ошибка регистрации.");
  }
}

/**
 * @param {{ email: string, fullName: string, password: string, confirmPassword?: string }} payload
 */
export async function registerStudent(payload) {
  return registerByRole("student", payload);
}

/**
 * @param {{ email: string, fullName: string, password: string, confirmPassword?: string }} payload
 */
export async function registerEmployer(payload) {
  return registerByRole("employer", payload);
}

export async function logout() {
  sessionStorage.removeItem("diasoft_access_token");
  return Promise.resolve();
}

export async function refreshSession() {
  return Promise.resolve({});
}

export async function requestPasswordReset(payload) {
  try {
    const res = await kotlinFetch("/api/v1/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await readErrorMessage(res));
    }
    return res.json();
  } catch (error) {
    if (error instanceof Error) {
      if (/failed to fetch|networkerror|load failed/i.test(error.message)) {
        throw new Error("Не удалось подключиться к сервису восстановления пароля.");
      }
      throw error;
    }
    throw new Error("Ошибка отправки запроса на восстановление.");
  }
}

export async function confirmPasswordReset(payload) {
  try {
    const res = await kotlinFetch("/api/v1/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await readErrorMessage(res));
    }
    return res.json();
  } catch (error) {
    if (error instanceof Error) {
      if (/failed to fetch|networkerror|load failed/i.test(error.message)) {
        throw new Error("Не удалось подключиться к сервису смены пароля.");
      }
      throw error;
    }
    throw new Error("Ошибка смены пароля.");
  }
}

export async function validatePasswordResetToken(token) {
  const safeToken = String(token ?? "").trim();
  if (!safeToken) return { active: false };
  try {
    const res = await kotlinFetch(`/api/v1/auth/password-reset/validate?token=${encodeURIComponent(safeToken)}`);
    if (!res.ok) {
      throw new Error(await readErrorMessage(res));
    }
    const data = await res.json();
    return { active: Boolean(data?.active) };
  } catch (error) {
    if (error instanceof Error) {
      if (/failed to fetch|networkerror|load failed/i.test(error.message)) {
        throw new Error("Не удалось подключиться к сервису проверки ссылки.");
      }
      throw error;
    }
    throw new Error("Ошибка проверки ссылки сброса.");
  }
}
