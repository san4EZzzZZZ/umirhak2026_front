export const ROLES = {
  university: "university",
  student: "student",
  employer: "employer",
  admin: "admin",
};

export const CABINET_PATHS = {
  [ROLES.university]: "/cabinet/vuz",
  [ROLES.student]: "/cabinet/student",
  [ROLES.employer]: "/cabinet/hr",
  [ROLES.admin]: "/cabinet/admin",
};

export function cabinetPathForRole(role) {
  return CABINET_PATHS[role] ?? "/";
}

export function loginPathForRole(role) {
  if (role === ROLES.university) return "/login/vuz";
  if (role === ROLES.admin) return "/login/admin";
  return "/login";
}
