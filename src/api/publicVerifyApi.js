import { kotlinFetch } from "./config.js";

export async function verifyStudentLinkToken(token) {
  const safeToken = String(token ?? "").trim();
  if (!safeToken) {
    throw new Error("Токен ссылки отсутствует.");
  }

  const res = await kotlinFetch(`/api/v1/verify/student-link/${encodeURIComponent(safeToken)}`);
  if (res.ok) {
    return res.json();
  }

  let message = "Не удалось проверить ссылку.";
  try {
    const payload = await res.json();
    if (typeof payload?.error === "string" && payload.error.trim()) {
      message = payload.error.trim();
    }
  } catch {
    // ignore
  }
  throw new Error(message);
}

