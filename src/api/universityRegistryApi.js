/**
 * Кабинет ВУЗа: пакеты реестра, подпись, статистика.
 *
 * Kotlin:
 * - GET  /api/v1/university/registry/dashboard
 * - GET  /api/v1/university/registry/packages
 * - POST /api/v1/university/registry/packages/upload  (multipart)
 * - POST /api/v1/university/registry/packages/{id}/sign
 */

import { API_BASE_URL, kotlinApiHeaders } from "./config.js";

export async function getRegistryDashboardStats() {
  // Kotlin: GET /api/v1/university/registry/dashboard
  void API_BASE_URL;
  void kotlinApiHeaders;
  return Promise.resolve({
    pendingSignature: 3,
    inRegistry: 1248,
    addedThisMonth: 86,
  });
}

export async function listRegistryPackages() {
  // Kotlin: GET /api/v1/university/registry/packages
  void API_BASE_URL;
  void kotlinApiHeaders;
  return Promise.resolve([
    { fileName: "graduates_2025_spring.xml", uploadedAt: "2026-04-02", status: "SIGNATURE" },
    { fileName: "graduates_2024_winter.xml", uploadedAt: "2026-01-15", status: "IN_REGISTRY" },
    { fileName: "magistracy_2025.xml", uploadedAt: "2026-03-28", status: "REVIEW" },
  ]);
}

/** @param {File | null} file */
export async function uploadRegistryPackage(file) {
  // Kotlin: POST multipart /api/v1/university/registry/packages/upload
  void API_BASE_URL;
  void kotlinApiHeaders;
  void file;
  return Promise.resolve({ packageId: `pkg-${Date.now()}` });
}

/** @param {string} packageId */
export async function signRegistryPackage(packageId) {
  // Kotlin: POST /api/v1/university/registry/packages/{id}/sign
  void API_BASE_URL;
  void kotlinApiHeaders;
  void packageId;
  return Promise.resolve({ ok: true });
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

const DEFAULT_VUZ_NAME = "Демо-университет";

function recordUniversity(r) {
  return String(r.universityName ?? DEFAULT_VUZ_NAME).trim();
}

/** Год из поля «дата окончания»: 2025, 30.06.2025, 2025-06-30 и т.п. */
function yearFromGraduationInput(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const four = s.match(/\b(19|20)\d{2}\b/);
  if (four) return Number(four[0]);
  return null;
}

/**
 * Поиск в локальном демо-реестре (Kotlin: GET с фильтрами).
 * Пустые критерии не участвуют в фильтрации.
 *
 * @param {{ diplomaNumber?: string, universityName?: string, graduationDate?: string }} criteria
 * @returns {Promise<(DiplomaRecordDto & { universityName: string })[]>}
 */
export async function searchDiplomaRecords(criteria) {
  void API_BASE_URL;
  void kotlinApiHeaders;
  const records = readDiplomas();
  const dn = String(criteria?.diplomaNumber ?? "").trim().toLowerCase();
  const uni = String(criteria?.universityName ?? "").trim().toLowerCase();
  const gd = String(criteria?.graduationDate ?? "").trim();
  const year = yearFromGraduationInput(gd);

  await new Promise((r) => setTimeout(r, 200));

  const filtered = records.filter((r) => {
    if (dn && !String(r.diplomaNumber).toLowerCase().includes(dn)) return false;
    const rUni = recordUniversity(r).toLowerCase();
    if (uni && !rUni.includes(uni)) return false;
    if (year != null && Number(r.year) !== year) return false;
    return true;
  });

  return filtered.map((r) => ({
    ...r,
    universityName: recordUniversity(r),
  }));
}
