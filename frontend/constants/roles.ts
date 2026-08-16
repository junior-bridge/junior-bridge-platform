export const USER_ROLES = {
  CLIENT: "CLIENT",
  TESTER: "TESTER",
  ADMIN: "ADMIN",
} as const;

export type UserRole =
  (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ROLE_LABELS: Record<UserRole, string> = {
  CLIENT: "Emprendedor",
  TESTER: "Tester Junior",
  ADMIN: "Administrador",
};