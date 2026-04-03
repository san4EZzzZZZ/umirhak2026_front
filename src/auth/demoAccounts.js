/**
 * Демо-учётные записи для всех кабинетов (макет без бэкенда).
 * Логин без учёта регистра, пароль — строго как указано.
 */
export const DEMO_ACCOUNTS = {
  university: {
    login: "vuz@demo.diasoft",
    password: "VuzDemo2026",
    firstName: "Иван",
    lastName: "Семёнов",
  },
  student: {
    login: "student@demo.diasoft",
    password: "Student2026",
    firstName: "Анна",
    lastName: "Петрова",
  },
  employer: {
    login: "hr@demo.diasoft",
    password: "HrDemo2026",
    firstName: "Олег",
    lastName: "Козлов",
  },
  admin: {
    login: "admin@demo.diasoft",
    password: "AdminDemo2026",
    firstName: "Алексей",
    lastName: "Демоадминов",
  },
  superadmin: {
    login: "super@demo.diasoft",
    password: "SuperDemo2026",
    firstName: "Елена",
    lastName: "Суперова",
  },
};

export function validateDemoCredentials(role, login, password) {
  const acc = DEMO_ACCOUNTS[role];
  if (!acc) return false;
  const sameLogin = acc.login.toLowerCase() === String(login).trim().toLowerCase();
  const samePass = acc.password === String(password);
  return sameLogin && samePass;
}

/**
 * Имя и фамилия для сессии по логину демо-аккаунта (любая роль).
 * @returns {{ firstName: string, lastName: string } | null}
 */
export function getDemoProfileByLogin(login) {
  const L = String(login).trim().toLowerCase();
  for (const acc of Object.values(DEMO_ACCOUNTS)) {
    if (acc.login.toLowerCase() === L) {
      return {
        firstName: acc.firstName ?? "",
        lastName: acc.lastName ?? "",
      };
    }
  }
  return null;
}

/** Для отображения на страницах входа */
export const DEMO_CREDENTIALS_LIST = [
  { roleKey: "university", ...DEMO_ACCOUNTS.university },
  { roleKey: "student", ...DEMO_ACCOUNTS.student },
  { roleKey: "employer", ...DEMO_ACCOUNTS.employer },
];
