export const UserRoles = {
  superUser: "1000",
  admin: "2000",
  userFL: "3011",
  userHL: "3012",
  userML: "3013",
  userLL: "3014",
} as const;
export const allRolesList = Object.values(UserRoles);

export const ROLE_ORDER = [
  UserRoles.superUser,
  UserRoles.admin,
  UserRoles.userFL,
  UserRoles.userHL,
  UserRoles.userML,
  UserRoles.userLL,
] as const;

export type RoleCode = typeof ROLE_ORDER[number];

export const ROLE_LABELS: Record<RoleCode, string> = {
  [UserRoles.superUser]: "Super User",
  [UserRoles.admin]: "Admin",
  [UserRoles.userFL]: "User FL",
  [UserRoles.userHL]: "User HL",
  [UserRoles.userML]: "User ML",
  [UserRoles.userLL]: "User LL",
};

const ROLE_SET = new Set<RoleCode>(ROLE_ORDER);
export const isRoleCode = (r: string): r is RoleCode => ROLE_SET.has(r as RoleCode);

export const ROLE_RANK: Record<RoleCode, number> =
  Object.fromEntries(ROLE_ORDER.map((r, i) => [r, i])) as Record<RoleCode, number>;

export const roleRank = (r: string) => (isRoleCode(r) ? ROLE_RANK[r] : 999);