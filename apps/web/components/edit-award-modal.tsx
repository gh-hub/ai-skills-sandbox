"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateAward } from "@/lib/api-client/awards";
import type { components } from "@/lib/api-client/schema";
import { DEFAULT_AWARD_ICON } from "@/lib/utils";

type Award = components["schemas"]["AwardDto"];

const editAwardSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  icon: z.string().optional(),
});

type EditAwardValues = z.infer<typeof editAwardSchema>;

type EditAwardModalProps = {
  award: Award | null;
  onClose: () => void;
};

// Two-step flow: the validated form first collects the new values, then a
// separate confirmation step is the only thing that actually triggers the
// PATCH — mirrors the plan's "double-confirm" decision for award edits.
export function EditAwardModal({ award, onClose }: EditAwardModalProps) {
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [pendingValues, setPendingValues] = useState<EditAwardValues | null>(
    null
  );
  const updateAward = useUpdateAward();

  const form = useForm<EditAwardValues>({
    resolver: zodResolver(editAwardSchema),
    defaultValues: { title: "", description: "", icon: "" },
  });

  useEffect(() => {
    if (award) {
      form.reset({
        title: award.title,
        description: award.description,
        icon: award.icon ?? "",
      });
      setStep("form");
      setPendingValues(null);
    }
  }, [award, form]);

  const handleClose = () => {
    setStep("form");
    setPendingValues(null);
    onClose();
  };

  const handleSubmit = (values: EditAwardValues) => {
    setPendingValues(values);
    setStep("confirm");
  };

  const handleConfirm = () => {
    if (!award || !pendingValues) {
      return;
    }
    const trimmedIcon = pendingValues.icon?.trim();

    updateAward.mutate(
      {
        id: award.id,
        body: {
          title: pendingValues.title,
          description: pendingValues.description,
          icon: trimmedIcon ? trimmedIcon : undefined,
        },
      },
      { onSuccess: handleClose }
    );
  };

  return (
    <Dialog
      open={award !== null}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose();
        }
      }}
    >
      <DialogContent>
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle>Edit award</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="flex flex-col gap-4"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={DEFAULT_AWARD_ICON} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit">Save changes</Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Save these changes?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to save these changes?
            </p>
            {updateAward.isError && (
              <p role="alert" className="text-sm text-destructive">
                Couldn&apos;t save changes. Please try again.
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={updateAward.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={updateAward.isPending}
              >
                Yes, save changes
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
