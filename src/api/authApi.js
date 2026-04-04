import { kotlinFetch } from "./config.js";

function saveAccessToken(token) {
  if (!token || typeof sessionStorage === "undefined") return;
  sessionStorage.setItem("diasoft_access_token", token);
}

async function readErrorMessage(res) {
  try {
    const data = await res.json();
    if (typeof data?.error === "string" && data.error.trim()) return data.error;
  } catch {
    /* ignore */
  }
  return `HTTP ${res.status}`;
}

/**
 * @param {{ role: string, login: string, password: string }} credentials
 * @returns {Promise<{ role: string, login: string, fullName?: string, universityCode?: string, accessToken?: string }>}
 */
export async function login(credentials) {
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
