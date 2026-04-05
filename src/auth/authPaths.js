export const ROLES = {
  university: "university",
  student: "student",
  employer: "employer",
  admin: "admin",
  superadmin: "superadmin",
};

/** Подписи ролей в интерфейсе (шапка кабинета и т.п.) */
export const ROLE_LABELS = {
  [ROLES.university]: "Представитель ВУЗа",
  [ROLES.student]: "Студент",
  [ROLES.employer]: "Работодатель (HR)",
  [ROLES.admin]: "Администратор платформы",
  [ROLES.superadmin]: "Суперпользователь",
};

export const CABINET_PATHS = {
  [ROLES.university]: "/cabinet/vuz",
  [ROLES.student]: "/cabinet/student",
  [ROLES.employer]: "/cabinet/hr",
  [ROLES.admin]: "/cabinet/admin",
  [ROLES.superadmin]: "/cabinet/superadmin",
};

export function cabinetPathForRole(role) {
  return CABINET_PATHS[role] ?? "/";
}

export function loginPathForRole(role) {
  if (role === ROLES.university) return "/login/vuz";
  if (role === ROLES.admin || role === ROLES.superadmin) return "/login/admin";
  return "/login";
}
