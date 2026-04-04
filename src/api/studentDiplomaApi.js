import { kotlinFetch } from "./config.js";

const AUTH_STORAGE_KEY = "diasoft_auth";

function getCurrentAuthLogin() {
  try {
    const localRaw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (localRaw) {
      const localData = JSON.parse(localRaw);
      if (typeof localData?.login === "string" && localData.login.trim()) {
        return localData.login.trim();
      }
    }
    const sessionRaw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (sessionRaw) {
      const sessionData = JSON.parse(sessionRaw);
      if (typeof sessionData?.login === "string" && sessionData.login.trim()) {
        return sessionData.login.trim();
      }
    }
  } catch {
    // ignore
  }
  return "";
}

async function readJsonOrThrow(res, defaultMessage) {
  if (res.ok) return res.json();
  let errorMessage = defaultMessage;
  try {
    const payload = await res.json();
    if (typeof payload?.error === "string" && payload.error.trim()) {
      errorMessage = payload.error.trim();
    }
  } catch {
    // ignore
  }
  throw new Error(errorMessage);
}

export async function checkDiplomaForCurrentStudent(payload) {
  const login = getCurrentAuthLogin();
  if (!login) {
    throw new Error("Не найден активный аккаунт выпускника.");
  }
  const body = {
    universityCode: String(payload.universityCode ?? "").trim(),
    diplomaNumber: String(payload.diplomaNumber ?? "").trim(),
    graduationYear: Number(payload.graduationYear),
    specialty: String(payload.specialty ?? "").trim(),
  };
  const res = await kotlinFetch(`/api/v1/student/registry/diploma-check?login=${encodeURIComponent(login)}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return readJsonOrThrow(res, "Не удалось проверить диплом.");
}

export async function createStudentVerificationLink(payload) {
  const login = getCurrentAuthLogin();
  if (!login) {
    throw new Error("Не найден активный аккаунт выпускника.");
  }
  const body = {
    universityCode: String(payload.universityCode ?? "").trim(),
    diplomaNumber: String(payload.diplomaNumber ?? "").trim(),
    ttlHours: Number(payload.ttlHours ?? 72),
  };
  const res = await kotlinFetch(`/api/v1/student/registry/verification-links?login=${encodeURIComponent(login)}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return readJsonOrThrow(res, "Не удалось выпустить QR-ссылку.");
}

export async function listStudentVerificationLinks() {
  const login = getCurrentAuthLogin();
  if (!login) {
    return [];
  }
  const res = await kotlinFetch(`/api/v1/student/registry/verification-links?login=${encodeURIComponent(login)}`);
  const data = await readJsonOrThrow(res, "Не удалось загрузить список QR-ссылок.");
  return Array.isArray(data) ? data : [];
}

export async function revokeStudentVerificationLink(token) {
  const login = getCurrentAuthLogin();
  if (!login) {
    throw new Error("Не найден активный аккаунт выпускника.");
  }
  const safeToken = String(token ?? "").trim();
  if (!safeToken) return { revoked: false };
  const res = await kotlinFetch(
    `/api/v1/student/registry/verification-links/${encodeURIComponent(safeToken)}/revoke?login=${encodeURIComponent(login)}`,
    { method: "POST" }
  );
  const data = await readJsonOrThrow(res, "Не удалось деактивировать QR-ссылку.");
  return { revoked: Boolean(data?.revoked) };
}
