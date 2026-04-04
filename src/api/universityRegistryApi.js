/**
 * Кабинет ВУЗа: статистика дашборда и записи реестра дипломов.
 *
 * Kotlin (пример):
 * - GET /api/v1/university/registry/dashboard
 * - CRUD дипломов — по договорённости (см. addDiplomaRecord и т.д.)
 * - Аннулирование по номеру — например DELETE /api/v1/university/diplomas/by-number?number=...
 */

import { API_BASE_URL, kotlinApiHeaders } from "./config.js";

export async function getRegistryDashboardStats() {
  // Kotlin: GET /api/v1/university/registry/dashboard
  void API_BASE_URL;
  void kotlinApiHeaders;
  return Promise.resolve({
    pendingSignature: 3,
    inRegistry: 1248,
  });
}

/* ——— Записи реестра дипломов (демо: localStorage; Kotlin: CRUD по реестру) ——— */

const DIPLOMA_STORAGE_KEY = "diasoft_vuz_diplomas_stub";

/**
 * @typedef {{ id: string, fullName: string, year: number, specialty: string, diplomaNumber: string, createdAt: string }} DiplomaRecordDto
 */

function readDiplomas() {
  try {
    const raw = localStorage.getItem(DIPLOMA_STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data?.records) ? data.records : [];
  } catch {
    return [];
  }
}

function writeDiplomas(records) {
  localStorage.setItem(DIPLOMA_STORAGE_KEY, JSON.stringify({ records }));
}

/** @returns {Promise<DiplomaRecordDto[]>} */
export async function listDiplomaRecords() {
  void API_BASE_URL;
  void kotlinApiHeaders;
  return Promise.resolve(readDiplomas());
}

/**
 * @param {{ fullName: string, year: number, specialty: string, diplomaNumber: string }} payload
 * @returns {Promise<DiplomaRecordDto>}
 */
export async function addDiplomaRecord(payload) {
  void API_BASE_URL;
  void kotlinApiHeaders;
  const records = readDiplomas();
  const row = {
    id: `dip-${Date.now()}`,
    fullName: String(payload.fullName).trim(),
    year: Number(payload.year),
    specialty: String(payload.specialty).trim(),
    diplomaNumber: String(payload.diplomaNumber).trim(),
    createdAt: new Date().toISOString(),
  };
  records.unshift(row);
  writeDiplomas(records);
  return Promise.resolve(row);
}

/**
 * @param {{ fullName: string, year: number, specialty: string, diplomaNumber: string }[]} rows
 * @returns {Promise<{ added: number }>}
 */
export async function addDiplomaRecordsBulk(rows) {
  void API_BASE_URL;
  void kotlinApiHeaders;
  const existing = readDiplomas();
  const base = Date.now();
  const newOnes = rows.map((r, i) => ({
    id: `dip-${base}-${i}`,
    fullName: String(r.fullName).trim(),
    year: Number(r.year),
    specialty: String(r.specialty).trim(),
    diplomaNumber: String(r.diplomaNumber).trim(),
    createdAt: new Date().toISOString(),
  }));
  writeDiplomas([...newOnes, ...existing]);
  return Promise.resolve({ added: newOnes.length });
}

/**
 * Удаляет запись реестра по номеру диплома (без учёта регистра и лишних пробелов по краям).
 * @param {string} diplomaNumber
 * @returns {Promise<{ removed: boolean, record?: DiplomaRecordDto }>}
 */
export async function annulDiplomaByNumber(diplomaNumber) {
  void API_BASE_URL;
  void kotlinApiHeaders;
  const q = String(diplomaNumber ?? "").trim().toLowerCase();
  if (!q) {
    return Promise.resolve({ removed: false });
  }
  const records = readDiplomas();
  const idx = records.findIndex((r) => String(r.diplomaNumber ?? "").trim().toLowerCase() === q);
  if (idx === -1) {
    return Promise.resolve({ removed: false });
  }
  const [removed] = records.splice(idx, 1);
  writeDiplomas(records);
  return Promise.resolve({ removed: true, record: removed });
}
