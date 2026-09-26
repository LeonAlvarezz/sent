import { createAccessControl } from "better-auth/plugins/access";

export const statement = {
  user: ["list", "set-role", "update", "ban", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const user = ac.newRole({});

export const admin = ac.newRole({
  user: ["list", "set-role", "update"],
});

export const super_admin = ac.newRole({
  user: ["list", "set-role", "update", "ban", "delete"],
});
