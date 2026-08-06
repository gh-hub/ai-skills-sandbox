"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { useCreateAward } from "@/lib/api-client/awards";
import { DEFAULT_AWARD_ICON } from "@/lib/utils";

const createAwardSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  icon: z.string().optional(),
});

type CreateAwardValues = z.infer<typeof createAwardSchema>;

export function CreateAwardForm() {
  const createAward = useCreateAward();
  const form = useForm<CreateAwardValues>({
    resolver: zodResolver(createAwardSchema),
    defaultValues: { title: "", description: "", icon: "" },
  });

  const handleSubmit = (values: CreateAwardValues) => {
    const trimmedIcon = values.icon?.trim();

    createAward.mutate(
      {
        title: values.title,
        description: values.description,
        icon: trimmedIcon ? trimmedIcon : undefined,
      },
      { onSuccess: () => form.reset() }
    );
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 text-left"
      >
        <h2 className="font-medium text-foreground">Create an award</h2>
        {createAward.isError && (
          <p role="alert" className="text-sm text-destructive">
            Couldn&apos;t create the award. Please try again.
          </p>
        )}
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
        <Button type="submit" disabled={createAward.isPending}>
          Create award
        </Button>
      </form>
    </Form>
  );
}
