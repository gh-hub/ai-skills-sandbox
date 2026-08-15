"use client";

import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { AwardCheckboxList } from "@/components/award-checkbox-list";
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
import { useSubmitLike } from "@/lib/api-client/likes";

export const storyFormSchema = z.object({
  story: z.string().optional(),
  hoursSaved: z
    .string()
    .optional()
    .refine((value) => !value || value.trim() === "" || Number(value) >= 0, {
      message: "Hours saved must be zero or greater",
    }),
  awardIds: z.array(z.string()).optional(),
});

export type StoryFormValues = z.infer<typeof storyFormSchema>;

type ShareStoryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<StoryFormValues>;
  storySubmit: ReturnType<typeof useSubmitLike>;
  onSubmit: (values: StoryFormValues) => void;
};

export function ShareStoryModal({
  open,
  onOpenChange,
  form,
  storySubmit,
  onSubmit,
}: ShareStoryModalProps) {
  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share a story</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 text-left"
          >
            {storySubmit.isError && (
              <p role="alert" className="text-sm text-destructive">
                Couldn&apos;t submit your story. Please try again.
              </p>
            )}
            <FormField
              control={form.control}
              name="story"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Story (optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hoursSaved"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hours saved (optional)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="awardIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Awards (optional)</FormLabel>
                  <AwardCheckboxList
                    selectedIds={field.value ?? []}
                    onChange={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={storySubmit.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={storySubmit.isPending}>
                Submit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
