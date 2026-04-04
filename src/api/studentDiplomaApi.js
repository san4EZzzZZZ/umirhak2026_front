/**
 * Кабинет студента: запись о дипломе, поиск по реестру, выпуск ссылки/QR с TTL.
 *
 * Kotlin:
 * - GET  /api/v1/student/me/diploma-record
 * - GET/POST поиск по номеру диплома / ФИО (по спецификации бэкенда)
 * - POST /api/v1/student/verification-links  — { ttlHours?: number }
 */

import { API_BASE_URL, kotlinApiHeaders } from "./config.js";

const DEMO_DIPLOMA_RECORD = {
  status: "CONFIRMED",
  universityName: "демо-университет",
  graduationYear: 2025,
  program: "Прикладная информатика",
  documentType: "Диплом бакалавра",
  diplomaNumber: "ДБ-2025-004921",
  holderFullName: "Петрова Анна Сергеевна",
};

export async function getMyDiplomaRecord() {
  void API_BASE_URL;
  void kotlinApiHeaders;
  return Promise.resolve({ ...DEMO_DIPLOMA_RECORD });
}

/**
 * Поиск своей записи по номеру диплома или ФИО (демо: совпадение с макетной записью).
 * @param {string} query
 * @returns {Promise<{ found: true, record: typeof DEMO_DIPLOMA_RECORD } | { found: false, reason: 'empty' | 'not_found' }>}
 */
export async function findSelfInRegistry(query) {
  void API_BASE_URL;
  void kotlinApiHeaders;
  const q = String(query).trim().toLowerCase().replace(/\s+/g, " ");
  await new Promise((r) => setTimeout(r, 320));
  if (!q) {
    return { found: false, reason: "empty" };
  }
  const compact = q.replace(/\s/g, "");
  const numMatch =
    compact.includes("дб-2025") ||
    compact.includes("db-2025") ||
    q.includes("004921") ||
    q.includes("2025-004921");
  const fioMatch =
    q.includes("петров") ||
    q.includes("анна") ||
    q.includes("петрова анна") ||
    q.includes("anna") ||
    q.includes("petrov");
  if (numMatch || fioMatch) {
    return { found: true, record: { ...DEMO_DIPLOMA_RECORD } };
  }
  return { found: false, reason: "not_found" };
}

/** @param {{ ttlHours?: number }} [opts] */
export async function issueVerificationLink(opts) {
  void API_BASE_URL;
  void kotlinApiHeaders;
  const part = () => Math.random().toString(36).slice(2, 10);
  const token = `verify_${part()}${part()}`;
  const ttlHours = opts?.ttlHours ?? 72;
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + ttlHours * 3600 * 1000);
  return Promise.resolve({
    token,
    verificationUrl: `${typeof window !== "undefined" ? window.location.origin : ""}/verify/${token}`,
    ttlHours,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });
}
