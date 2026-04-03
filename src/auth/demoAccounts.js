/**
 * Демо-учётные записи для всех кабинетов (макет без бэкенда).
 * Логин без учёта регистра, пароль — строго как указано.
 */
export const DEMO_ACCOUNTS = {
  university: {
    login: "vuz@demo.diasoft",
    password: "VuzDemo2026",
  },
  student: {
    login: "student@demo.diasoft",
    password: "Student2026",
  },
  employer: {
    login: "hr@demo.diasoft",
    password: "HrDemo2026",
  },
  admin: {
    login: "admin@demo.diasoft",
    password: "AdminDemo2026",
  },
};

export function validateDemoCredentials(role, login, password) {
  const acc = DEMO_ACCOUNTS[role];
  if (!acc) return false;
  const sameLogin = acc.login.toLowerCase() === String(login).trim().toLowerCase();
  const samePass = acc.password === String(password);
  return sameLogin && samePass;
}

/** Для отображения на страницах входа */
export const DEMO_CREDENTIALS_LIST = [
  { roleKey: "university", ...DEMO_ACCOUNTS.university },
  { roleKey: "student", ...DEMO_ACCOUNTS.student },
  { roleKey: "employer", ...DEMO_ACCOUNTS.employer },
];
