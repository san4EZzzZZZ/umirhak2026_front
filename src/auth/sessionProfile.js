import { getDemoProfileByLogin } from "./demoAccounts.js";
import { getPlatformAdminProfileNames } from "../api/adminPlatformAdminsApi.js";

/**
 * Имя и фамилия для сохранения в сессии после входа (демо + локальные админы).
 */
export function resolveSessionProfile(login) {
  return (
    getDemoProfileByLogin(login) ??
    getPlatformAdminProfileNames(login) ?? { firstName: "", lastName: "" }
  );
}

/**
 * Разбор ФИО в профиль сессии: "Фамилия Имя Отчество" -> { lastName, firstName }.
 */
export function toSessionProfileFromFullName(fullName) {
  const parts = String(fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: "", lastName: parts[0] };
  return { firstName: parts[1], lastName: parts[0] };
}
