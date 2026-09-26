import * as React from "react";
import {
  Avatar,
  Button,
  Field,
  FieldLabel,
  Modal,
  ModalBody,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  NativeSelect,
  Tag,
  toast,
} from "@z3/admin-core";
import { USER_ROLE } from "@z3/types";
import type { User } from "@z3/types";
import { useUpdateUserRoleMutation } from "../api/user.api";
import { getErrorMessage } from "@/libs/api-client";
import UserRoleTag from "./user-role-tag";

interface ChangeRoleModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  targetUser: User | null;
  currentUser?: { id?: string; email?: string; role?: string | null } | null;
}

export function ChangeRoleModal({
  isOpen,
  setIsOpen,
  targetUser,
  currentUser,
}: ChangeRoleModalProps) {
  const [role, setRole] = React.useState<USER_ROLE>(USER_ROLE.USER);
  const updateRoleMutation = useUpdateUserRoleMutation();

  React.useEffect(() => {
    if (targetUser?.role) {
      setRole(targetUser.role);
    } else {
      setRole(USER_ROLE.USER);
    }
  }, [targetUser]);

  if (!targetUser) return null;

  const isSelf =
    Boolean(currentUser?.id && currentUser.id === targetUser.id) ||
    Boolean(currentUser?.email && currentUser.email === targetUser.email);

  const isSuperAdmin = currentUser?.role === USER_ROLE.SUPER_ADMIN;
  const isTargetSuperAdmin = targetUser.role === USER_ROLE.SUPER_ADMIN;
  const canModify = isSuperAdmin || !isTargetSuperAdmin;

  const roleOptions = [
    {
      value: USER_ROLE.USER,
      label: "User",
    },
    {
      value: USER_ROLE.ADMIN,
      label: "Admin",
    },
    ...(isSuperAdmin
      ? [
          {
            value: USER_ROLE.SUPER_ADMIN,
            label: "Super Admin",
          },
        ]
      : []),
  ];

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();

    if (isSelf && role !== targetUser.role) {
      toast.error("You cannot change your own role.");
      return;
    }

    if (!canModify) {
      toast.error("Only Super Admins can modify another Super Admin.");
      return;
    }

    try {
      await updateRoleMutation.mutateAsync({
        userId: targetUser.id,
        role,
      });
      toast.success(`Updated ${targetUser.name}'s role to ${role}`);
      setIsOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update user role"));
    }
  };

  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <ModalHeader>
          <ModalTitle>Change User Role</ModalTitle>
          <ModalDescription>
            Update administrative permissions and system access level.
          </ModalDescription>
        </ModalHeader>

        <ModalBody className="space-y-5">
          {/* Target User Info Summary */}
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
            {targetUser.image ? (
              <Avatar
                src={targetUser.image}
                className="size-10 ring-1 ring-border shrink-0"
              />
            ) : (
              <div className="size-10 rounded-full bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center shrink-0 ring-1 ring-border">
                {targetUser.name
                  ? targetUser.name.slice(0, 2).toUpperCase()
                  : "U"}
              </div>
            )}
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-semibold text-foreground text-sm truncate">
                {targetUser.name}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {targetUser.email}
              </span>
            </div>
            <UserRoleTag role={targetUser.role} />
          </div>

          {/* Warnings if self or restricted */}
          {isSelf && (
            <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
              <strong>Note:</strong> You cannot change your own role to prevent
              accidental lockout from the administration panel.
            </div>
          )}

          {!isSuperAdmin && isTargetSuperAdmin && (
            <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-400">
              <strong>Restricted:</strong> Only Super Administrators can modify
              the permissions of another Super Administrator.
            </div>
          )}

          {/* Role selector field */}
          <Field className="space-y-1.5">
            <FieldLabel htmlFor="user-role-select">Select New Role</FieldLabel>
            <NativeSelect
              id="user-role-select"
              value={role}
              disabled={isSelf || !canModify || updateRoleMutation.isPending}
              onChange={(e) => setRole(e.target.value as USER_ROLE)}
              options={roleOptions}
            />
          </Field>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(false)}
            disabled={updateRoleMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            size="sm"
            disabled={
              isSelf ||
              !canModify ||
              role === targetUser.role ||
              updateRoleMutation.isPending
            }
          >
            {updateRoleMutation.isPending ? "Updating..." : "Save"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
