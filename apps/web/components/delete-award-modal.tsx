"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteAward } from "@/lib/api-client/awards";
import type { components } from "@/lib/api-client/schema";

type Award = components["schemas"]["AwardDto"];

type DeleteAwardModalProps = {
  award: Award | null;
  onClose: () => void;
};

// Single confirm/cancel step — the plan's delete flow only calls for one
// confirmation, unlike the edit flow's double-confirm.
export function DeleteAwardModal({ award, onClose }: DeleteAwardModalProps) {
  const deleteAward = useDeleteAward();

  const handleConfirm = () => {
    if (!award) {
      return;
    }
    deleteAward.mutate(award.id, { onSuccess: onClose });
  };

  return (
    <Dialog
      open={award !== null}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete award</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-medium text-foreground">{award?.title}</span>?
        </p>
        {deleteAward.isError && (
          <p role="alert" className="text-sm text-destructive">
            Couldn&apos;t delete award. Please try again.
          </p>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleteAward.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteAward.isPending}
          >
            Yes, delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
