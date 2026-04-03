/**
 * Суперпользователь: учётные записи администраторов платформы (не путать с пользователями ВУЗов).
 *
 * Kotlin (пример):
 * - GET    /api/v1/superadmin/platform-admins
 * - POST   /api/v1/superadmin/platform-admins
 * - DELETE /api/v1/superadmin/platform-admins/{id}
 */

import { API_BASE_URL, kotlinApiHeaders } from "./config.js";
import { DEMO_ACCOUNTS } from "../auth/demoAccounts.js";

const STORAGE_KEY = "diasoft_platform_admins_stub";

/** Встроенная запись (не из localStorage) */
export const BUILT_IN_ADMIN_ID = "built-in-admin";

/**
 * @typedef {{ id: string, login: string, fullName: string, active: boolean, createdAt: string, builtIn?: boolean }} PlatformAdminDto
 */

/** @returns {{ id: string, login: string, password: string, fullName: string, createdAt: string }[]} */
function readExtras() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data?.admins) ? data.admins : [];
  } catch {
    return [];
  }
}

function writeExtras(admins) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ admins }));
}

function normalizeLogin(login) {
  return String(login).trim().toLowerCase();
}

/** Фамилия + имя из строки ФИО (русский порядок: первое слово — фамилия). */
function splitFullNameToParts(fullName) {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: "", lastName: parts[0] };
  return { lastName: parts[0], firstName: parts[1] };
}

/**
 * Имя для шапки кабинета: администраторы, созданные суперпользователем (только localStorage).
 * @returns {{ firstName: string, lastName: string } | null}
 */
export function getPlatformAdminProfileNames(login) {
  const L = normalizeLogin(login);
  const x = readExtras().find((i) => normalizeLogin(i.login) === L);
  if (!x) return null;
  return splitFullNameToParts(x.fullName);
}

/**
 * Проверка входа администратора: демо-админ из константы + созданные суперпользователем (локально).
 */
export function validatePlatformAdminLogin(login, password) {
  const a = DEMO_ACCOUNTS.admin;
  if (a.login.toLowerCase() === normalizeLogin(login) && a.password === String(password)) return true;
  const L = normalizeLogin(login);
  const P = String(password);
  return readExtras().some((x) => normalizeLogin(x.login) === L && x.password === P);
}

/**
 * @returns {Promise<PlatformAdminDto[]>}
 */
export async function listPlatformAdmins() {
  void API_BASE_URL;
  void kotlinApiHeaders;
  const builtIn = {
    id: BUILT_IN_ADMIN_ID,
    login: DEMO_ACCOUNTS.admin.login,
    fullName: "Демо-администратор",
    active: true,
    createdAt: new Date(0).toISOString(),
    builtIn: true,
  };
  const extras = readExtras().map((x) => ({
    id: x.id,
    login: x.login,
    fullName: x.fullName,
    active: x.active !== false,
    createdAt: x.createdAt,
    builtIn: false,
  }));
  return Promise.resolve([builtIn, ...extras]);
}

/**
 * @param {{ login: string, fullName: string, temporaryPassword: string }} payload
 * @returns {Promise<PlatformAdminDto>}
 */
export async function createPlatformAdmin(payload) {
  void API_BASE_URL;
  void kotlinApiHeaders;
  const login = String(payload.login).trim();
  const fullName = String(payload.fullName).trim();
  const temporaryPassword = String(payload.temporaryPassword);
  const L = normalizeLogin(login);

  if (!login || !fullName || !temporaryPassword) {
    throw new Error("empty");
  }
  if (L === normalizeLogin(DEMO_ACCOUNTS.admin.login)) {
    throw new Error("duplicate");
  }
  if (L === normalizeLogin(DEMO_ACCOUNTS.superadmin.login)) {
    throw new Error("reserved");
  }
  const extras = readExtras();
  if (extras.some((x) => normalizeLogin(x.login) === L)) {
    throw new Error("duplicate");
  }

  const row = {
    id: `pa-${Date.now()}`,
    login,
    password: temporaryPassword,
    fullName,
    active: true,
    createdAt: new Date().toISOString(),
  };
  writeExtras([...extras, row]);

  return Promise.resolve({
    id: row.id,
    login: row.login,
    fullName: row.fullName,
    active: true,
    createdAt: row.createdAt,
    builtIn: false,
  });
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deletePlatformAdmin(id) {
  void API_BASE_URL;
  void kotlinApiHeaders;
  if (id === BUILT_IN_ADMIN_ID) {
    throw new Error("built-in");
  }
  const extras = readExtras();
  const next = extras.filter((x) => x.id !== id);
  if (next.length === extras.length) {
    throw new Error("not-found");
  }
  writeExtras(next);
  return Promise.resolve();
}
