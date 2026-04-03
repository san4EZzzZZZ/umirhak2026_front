/**
 * Админка: пользователи ВУЗов (учётные записи регистраторов / подписантов).
 *
 * Kotlin (пример контроллера):
 * - GET    /api/v1/admin/university-users
 * - POST   /api/v1/admin/university-users
 * - PATCH  /api/v1/admin/university-users/{id}
 * - DELETE /api/v1/admin/university-users/{id}
 */

import { API_BASE_URL, kotlinApiHeaders } from "./config.js";

/** @typedef {{ id: string, email: string, fullName: string, universityName: string, vuzUserRole: 'REGISTRAR' | 'SIGNER', active: boolean, createdAt?: string }} UniversityUserDto */

const STUB_SEED = [
  {
    id: "seed-1",
    email: "registrar@vuz1.demo",
    fullName: "Сидоров П. П.",
    universityName: "Демо-политех",
    vuzUserRole: "REGISTRAR",
    active: true,
    createdAt: new Date().toISOString(),
  },
];

/**
 * @returns {Promise<UniversityUserDto[]>}
 */
export async function listUniversityUsers() {
  // Kotlin: GET /api/v1/admin/university-users
  void API_BASE_URL;
  void kotlinApiHeaders;
  return Promise.resolve([...STUB_SEED]);
}

/**
 * @param {{ email: string, fullName: string, universityName: string, vuzUserRole: 'REGISTRAR' | 'SIGNER', temporaryPassword: string }} payload
 * @returns {Promise<UniversityUserDto>}
 */
export async function createUniversityUser(payload) {
  // Kotlin: POST /api/v1/admin/university-users
  void API_BASE_URL;
  void kotlinApiHeaders;
  void payload.temporaryPassword;
  const row = {
    id: `stub-${Date.now()}`,
    email: payload.email.trim(),
    fullName: payload.fullName.trim(),
    universityName: payload.universityName.trim(),
    vuzUserRole: payload.vuzUserRole,
    active: true,
    createdAt: new Date().toISOString(),
  };
  return Promise.resolve(row);
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteUniversityUser(id) {
  // Kotlin: DELETE /api/v1/admin/university-users/{id}
  void API_BASE_URL;
  void kotlinApiHeaders;
  void id;
  return Promise.resolve();
}

/**
 * @param {string} id
 * @param {{ active?: boolean }} patch
 * @returns {Promise<UniversityUserDto>}
 */
export async function patchUniversityUser(id, patch) {
  // Kotlin: PATCH /api/v1/admin/university-users/{id}
  void API_BASE_URL;
  void kotlinApiHeaders;
  return Promise.resolve({ id, ...patch });
}
