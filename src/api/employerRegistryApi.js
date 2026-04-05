/**
 * Кабинет HR: поиск в реестре, проверка по QR.
 *
 * Kotlin:
 * - GET  /api/v1/employer/registry/search?university=&diplomaNumber=
 * - POST /api/v1/employer/verify/qr  — { payload: string }
 */

import { API_BASE_URL, kotlinApiHeaders } from "./config.js";

/**
 * @param {{ university: string, diplomaNumber: string }} params
 * @returns {Promise<{ id: string, fio: string, vuz: string, diplomaNumber: string, year: string, status: string }[]>}
 */
export async function searchRegistry(params) {
  // Kotlin: GET /api/v1/employer/registry/search?university=...&diplomaNumber=...
  void API_BASE_URL;
  void kotlinApiHeaders;
  const all = [
    {
      id: "1",
      fio: "Иванов И. И.",
      vuz: "DEMO / Демо-университет",
      diplomaNumber: "ВСГ 1234567",
      year: "2025",
      status: "Совпадение в реестре",
    },
    {
      id: "2",
      fio: "Петрова А. С.",
      vuz: "DEMO / Демо-университет",
      diplomaNumber: "МСК 7654321",
      year: "2024",
      status: "Совпадение в реестре",
    },
  ];
  const university = String(params?.university ?? "")
    .trim()
    .toLowerCase();
  const diplomaNumber = String(params?.diplomaNumber ?? "")
    .trim()
    .toLowerCase();
  if (!university && !diplomaNumber) return Promise.resolve(all);
  return Promise.resolve(
    all.filter((r) => {
      const byUniversity = !university || r.vuz.toLowerCase().includes(university);
      const byDiplomaNumber = !diplomaNumber || r.diplomaNumber.toLowerCase().includes(diplomaNumber);
      return byUniversity && byDiplomaNumber;
    })
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
