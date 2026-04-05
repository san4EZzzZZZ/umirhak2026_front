import { kotlinFetch } from "./config.js";

const AUTH_STORAGE_KEY = "diasoft_auth";

function getCurrentAdminLogin() {
  try {
    const localRaw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      if (typeof parsed?.login === "string" && parsed.login.trim()) return parsed.login.trim();
    }
    const sessionRaw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw);
      if (typeof parsed?.login === "string" && parsed.login.trim()) return parsed.login.trim();
    }
  } catch {
    // ignore
  }
  return "";
}

async function readJsonOrThrow(res, defaultMessage) {
  if (res.ok) return res.json();
  let msg = defaultMessage;
  try {
    const payload = await res.json();
    if (typeof payload?.error === "string" && payload.error.trim()) msg = payload.error.trim();
  } catch {
    // ignore
  }
  throw new Error(msg);
}

export async function listUniversityUsers() {
  const login = getCurrentAdminLogin();
  if (!login) throw new Error("Не найден активный аккаунт администратора.");

  const res = await kotlinFetch(`/api/v1/admin/universities?login=${encodeURIComponent(login)}`);
  const rows = await readJsonOrThrow(res, "Не удалось загрузить список ВУЗов.");
  return Array.isArray(rows)
    ? rows.map((row) => ({
        id: String(row.code ?? row.email ?? Math.random()),
        email: String(row.email ?? "").trim(),
        fullName: String(row.contactFullName ?? "").trim(),
        universityName: String(row.name ?? "").trim(),
        vuzUserRole: "REGISTRAR",
        active: Boolean(row.active),
        createdAt: row.createdAt,
        code: String(row.code ?? "").trim(),
      }))
    : [];
}

export async function createUniversityUser(payload) {
  const login = getCurrentAdminLogin();
  if (!login) throw new Error("Не найден активный аккаунт администратора.");

  const universityName = String(payload.universityName ?? "").trim();
  const body = {
    code: universityName,
    name: universityName,
    email: String(payload.email ?? "").trim(),
    contactFullName: String(payload.fullName ?? "").trim(),
    password: String(payload.temporaryPassword ?? ""),
  };
  const res = await kotlinFetch(`/api/v1/admin/universities?login=${encodeURIComponent(login)}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const row = await readJsonOrThrow(res, "Не удалось создать аккаунт ВУЗа.");
  return {
    id: String(row.code ?? row.email ?? Math.random()),
    email: String(row.email ?? "").trim(),
    fullName: String(row.contactFullName ?? "").trim(),
    universityName: String(row.name ?? "").trim(),
    vuzUserRole: "REGISTRAR",
    active: true,
    code: String(row.code ?? "").trim(),
    createdAt: new Date().toISOString(),
  };
}

export async function deleteUniversityUser() {
  throw new Error("Удаление аккаунта ВУЗа пока не реализовано.");
}

export async function patchUniversityUser(id, patch) {
  return Promise.resolve({ id, ...patch });
}

