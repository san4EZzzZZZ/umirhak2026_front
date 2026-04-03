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
