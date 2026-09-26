import { Tag } from "@z3/admin-core";
import { USER_ROLE } from "@z3/types";

type UserRoleTagProps = {
  role: USER_ROLE;
};
function UserRoleTag({ role }: UserRoleTagProps) {
  const label =
    role === USER_ROLE.SUPER_ADMIN
      ? "Super Admin"
      : role === USER_ROLE.ADMIN
        ? "Admin"
        : "User";

  const color =
    role === USER_ROLE.SUPER_ADMIN
      ? "violet"
      : role === USER_ROLE.ADMIN
        ? "blue"
        : "slate";
  return <Tag color={color}>{label}</Tag>;
}
export default UserRoleTag;
