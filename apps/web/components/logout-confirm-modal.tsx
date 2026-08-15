"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLogout } from "@/lib/api-client/auth";

type LogoutConfirmModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logout: ReturnType<typeof useLogout>;
};

export function LogoutConfirmModal({
  open,
  onOpenChange,
  logout,
}: LogoutConfirmModalProps) {
  const showGenericError = logout.isError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log out?</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Are you sure you want to log out?
        </p>

        {showGenericError && (
          <p role="alert" className="text-sm text-destructive">
            Couldn&apos;t log out. Please try again.
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={logout.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={() =>
              logout.mutate(undefined, {
                onSuccess: () => onOpenChange(false),
              })
            }
            disabled={logout.isPending}
          >
            Yes, log out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
