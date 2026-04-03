export const ROLES = {
  university: "university",
  student: "student",
  employer: "employer",
};

export const CABINET_PATHS = {
  [ROLES.university]: "/cabinet/vuz",
  [ROLES.student]: "/cabinet/student",
  [ROLES.employer]: "/cabinet/hr",
};

export function cabinetPathForRole(role) {
  return CABINET_PATHS[role] ?? "/";
}

export function loginPathForRole(role) {
  return role === ROLES.university ? "/login/vuz" : "/login";
}
