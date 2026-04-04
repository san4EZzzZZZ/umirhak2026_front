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
    // ignore parse/storage errors
  }
  return "";
}

async function readJsonOrThrow(res, defaultMessage) {
  if (res.ok) {
    return res.json();
  }
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

function mapRowToBackend(row) {
  return {
    fullName: String(row.fullName ?? "").trim(),
    specialty: String(row.specialty ?? "").trim(),
    diplomaCode: String(row.diplomaNumber ?? "").trim(),
    graduationYear: Number(row.year),
  };
}

function mapDtoToUi(row) {
  return {
    id: row.id,
    fullName: row.fullName,
    specialty: row.specialty,
    year: Number(row.graduationYear),
    diplomaNumber: row.diplomaNumber,
    createdAt: row.createdAt,
    status: row.status,
  };
}

export async function getRegistryDashboardStats() {
  try {
    const login = getCurrentAuthLogin();
    if (!login) {
      return { pendingSignature: 0, inRegistry: 0 };
    }

    const res = await kotlinFetch(`/api/v1/university/registry/dashboard?login=${encodeURIComponent(login)}`);
    const data = await readJsonOrThrow(res, "Не удалось загрузить статистику реестра.");
    return {
      pendingSignature: Number(data?.pendingSignature ?? 0),
      inRegistry: Number(data?.inRegistry ?? 0),
    };
  } catch {
    return { pendingSignature: 0, inRegistry: 0 };
  }
}

export async function listDiplomaRecords() {
  const login = getCurrentAuthLogin();
  if (!login) return [];
  const res = await kotlinFetch(`/api/v1/university/registry/diplomas?login=${encodeURIComponent(login)}`);
  const data = await readJsonOrThrow(res, "Не удалось получить список дипломов.");
  return Array.isArray(data) ? data.map(mapDtoToUi) : [];
}

export async function addDiplomaRecordsBulk(rows) {
  const login = getCurrentAuthLogin();
  if (!login) {
    throw new Error("Не найден активный пользователь ВУЗа.");
  }
  const payload = rows.map(mapRowToBackend);
  const res = await kotlinFetch(`/api/v1/university/registry/diplomas/bulk?login=${encodeURIComponent(login)}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await readJsonOrThrow(res, "Не удалось загрузить дипломы в реестр.");
  return { added: Number(data?.added ?? payload.length) };
}

export async function annulDiplomaByNumber(diplomaNumber) {
  const login = getCurrentAuthLogin();
  if (!login) {
    throw new Error("Не найден активный пользователь ВУЗа.");
  }
  const number = String(diplomaNumber ?? "").trim();
  if (!number) {
    return { removed: false };
  }
  const res = await kotlinFetch(
    `/api/v1/university/registry/diplomas/revoke?login=${encodeURIComponent(login)}&diplomaNumber=${encodeURIComponent(number)}`,
    { method: "POST" }
  );
  const data = await readJsonOrThrow(res, "Не удалось аннулировать диплом.");
  return { removed: Boolean(data?.removed) };
}

export async function previewAnnulDiplomaByNumber(diplomaNumber) {
  const login = getCurrentAuthLogin();
  if (!login) {
    throw new Error("Не найден активный пользователь ВУЗа.");
  }
  const number = String(diplomaNumber ?? "").trim();
  if (!number) {
    return { found: false };
  }
  const res = await kotlinFetch(
    `/api/v1/university/registry/diplomas/revoke-preview?login=${encodeURIComponent(login)}&diplomaNumber=${encodeURIComponent(number)}`
  );
  const data = await readJsonOrThrow(res, "Не удалось найти диплом.");
  return {
    found: Boolean(data?.found),
    fullName: typeof data?.fullName === "string" ? data.fullName : "",
    diplomaNumber: typeof data?.diplomaNumber === "string" ? data.diplomaNumber : number,
  };
}

export async function commitSignedDiplomaRecord(payload) {
  const login = getCurrentAuthLogin();
  if (!login) {
    throw new Error("Не найден активный пользователь ВУЗа.");
  }
  const body = {
    fullName: String(payload.fullName ?? "").trim(),
    specialty: String(payload.specialty ?? "").trim(),
    diplomaCode: String(payload.diplomaNumber ?? "").trim(),
    graduationYear: Number(payload.year),
    privateKeyHash: String(payload.privateKeyHash ?? "").trim().toLowerCase(),
    signatureBase64: String(payload.signatureBase64 ?? "").trim(),
    publicKeyPem: String(payload.publicKeyPem ?? "").trim(),
    signatureAlgorithm: String(payload.signatureAlgorithm ?? "").trim(),
  };
  const res = await kotlinFetch(`/api/v1/university/registry/diplomas?login=${encodeURIComponent(login)}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  await readJsonOrThrow(res, "Не удалось сохранить подписанный диплом в реестр.");
  return {
    id: "",
    fullName: body.fullName,
    specialty: body.specialty,
    year: body.graduationYear,
    diplomaNumber: body.diplomaCode,
    createdAt: new Date().toISOString(),
  };
}
