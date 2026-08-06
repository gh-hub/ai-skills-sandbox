"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RoleInUseError,
  useDeleteRole,
  type RoleAffectedUser,
} from "@/lib/api-client/roles";
import type { components } from "@/lib/api-client/schema";

type Role = components["schemas"]["RoleDto"];

type DeleteRoleModalProps = {
  role: Role | null;
  onClose: () => void;
};

// First confirm calls DELETE without `force`. If that comes back 409 (role
// in use), the same modal switches to showing who's affected and a
// force-delete button that retries with `force=true` — one modal, two steps,
// rather than a separate follow-up dialog.
export function DeleteRoleModal({ role, onClose }: DeleteRoleModalProps) {
  const deleteRole = useDeleteRole();
  const [affectedUsers, setAffectedUsers] = useState<RoleAffectedUser[] | null>(
    null
  );

  useEffect(() => {
    setAffectedUsers(null);
  }, [role]);

  const handleClose = () => {
    setAffectedUsers(null);
    onClose();
  };

  const handleConfirm = () => {
    if (!role) {
      return;
    }
    deleteRole.mutate(
      { id: role.id },
      {
        onSuccess: handleClose,
        onError: (error) => {
          if (error instanceof RoleInUseError) {
            setAffectedUsers(error.affectedUsers);
          }
        },
      }
    );
  };

  const handleForceConfirm = () => {
    if (!role) {
      return;
    }
    deleteRole.mutate({ id: role.id, force: true }, { onSuccess: handleClose });
  };

  const isBlockedByUsage = affectedUsers !== null;
  const showGenericError =
    deleteRole.isError && !(deleteRole.error instanceof RoleInUseError);

  return (
    <Dialog
      open={role !== null}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete role</DialogTitle>
        </DialogHeader>

        {!isBlockedByUsage && (
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{role?.name}</span>?
          </p>
        )}

        {isBlockedByUsage && affectedUsers && (
          <>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{role?.name}</span>{" "}
              is currently assigned to these users:
            </p>
            <ul className="flex flex-col gap-1 text-sm">
              {affectedUsers.map((user) => (
                <li key={user.email} className="text-foreground">
                  {user.name}{" "}
                  <span className="text-muted-foreground">({user.email})</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground">
              Deleting it will remove it from all of them.
            </p>
          </>
        )}

        {showGenericError && (
          <p role="alert" className="text-sm text-destructive">
            Couldn&apos;t delete role. Please try again.
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={deleteRole.isPending}
          >
            Cancel
          </Button>
          {!isBlockedByUsage ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={deleteRole.isPending}
            >
              Yes, delete
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              onClick={handleForceConfirm}
              disabled={deleteRole.isPending}
            >
              Delete anyway
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
