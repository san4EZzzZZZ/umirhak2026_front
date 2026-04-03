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
