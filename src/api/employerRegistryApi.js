/**
 * Кабинет HR: поиск в реестре, проверка по QR.
 *
 * Kotlin:
 * - GET  /api/v1/employer/registry/search?q=
 * - POST /api/v1/employer/verify/qr  — { payload: string }
 */

import { API_BASE_URL, kotlinApiHeaders } from "./config.js";

/**
 * @param {string} query
 * @returns {Promise<{ id: string, fio: string, vuz: string, year: string, status: string }[]>}
 */
export async function searchRegistry(query) {
  // Kotlin: GET /api/v1/employer/registry/search?q=...
  void API_BASE_URL;
  void kotlinApiHeaders;
  const all = [
    { id: "1", fio: "Иванов И. И.", vuz: "Демо-университет", year: "2025", status: "Совпадение в реестре" },
    { id: "2", fio: "Петрова А. С.", vuz: "Демо-университет", year: "2024", status: "Совпадение в реестре" },
  ];
  const q = query.trim().toLowerCase();
  if (!q) return Promise.resolve(all);
  return Promise.resolve(
    all.filter((r) => r.fio.toLowerCase().includes(q) || r.vuz.toLowerCase().includes(q))
  );
}

/** @param {string} rawQrPayload */
export async function verifyQrPayload(rawQrPayload) {
  // Kotlin: POST /api/v1/employer/verify/qr
  void API_BASE_URL;
  void kotlinApiHeaders;
  void rawQrPayload;
  return Promise.resolve({ valid: false, reason: "STUB" });
}
