import { Ability, AbilityBuilder } from "@casl/ability";
import type { User } from "../stores/auth";

// actions: 'manage' | 'create' | 'read' | 'update' | 'delete'
export type AppAbility = Ability<[string, string | { __type: string; [k: string]: any }]>;

export function buildAbility(user: User | null) {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(Ability as any);
  if (!user) return build();

  if (user.roles.includes("admin")) {
    can("manage", "all");
  } else {
    can("read", "Device");
    can("read", "Scan");
    cannot("delete", "User");
  }
  return build();
}
