/**
 * Кабинет студента: запись о дипломе, выпуск ссылки/QR с TTL.
 *
 * Kotlin:
 * - GET  /api/v1/student/me/diploma-record
 * - POST /api/v1/student/verification-links  — { ttlHours?: number }
 */

import { API_BASE_URL, kotlinApiHeaders } from "./config.js";

export async function getMyDiplomaRecord() {
  // Kotlin: GET /api/v1/student/me/diploma-record
  void API_BASE_URL;
  void kotlinApiHeaders;
  return Promise.resolve({
    status: "CONFIRMED",
    universityName: "демо-университет",
    graduationYear: 2025,
    program: "Прикладная информатика",
    documentType: "Диплом бакалавра",
  });
}

/** @param {{ ttlHours?: number }} [opts] */
export async function issueVerificationLink(opts) {
  // Kotlin: POST /api/v1/student/verification-links
  void API_BASE_URL;
  void kotlinApiHeaders;
  const part = () => Math.random().toString(36).slice(2, 10);
  const token = `verify_${part()}${part()}`;
  const ttlHours = opts?.ttlHours ?? 72;
  return Promise.resolve({
    token,
    verificationUrl: `${typeof window !== "undefined" ? window.location.origin : ""}/verify/${token}`,
    ttlHours,
    issuedAt: new Date().toISOString(),
  });
}
