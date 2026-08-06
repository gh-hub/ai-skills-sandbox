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
import { useCreateRole } from "@/lib/api-client/roles";

const createRoleSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type CreateRoleValues = z.infer<typeof createRoleSchema>;

function extractServerErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return fallback;
}

export function CreateRoleForm() {
  const createRole = useCreateRole();
  const form = useForm<CreateRoleValues>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: { name: "" },
  });

  const handleSubmit = (values: CreateRoleValues) => {
    createRole.mutate(
      { name: values.name },
      { onSuccess: () => form.reset() }
    );
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 text-left"
      >
        <h2 className="font-medium text-foreground">Create a role</h2>
        {createRole.isError && (
          <p role="alert" className="text-sm text-destructive">
            {extractServerErrorMessage(
              createRole.error,
              "Couldn't create the role. Please try again."
            )}
          </p>
        )}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={createRole.isPending}>
          Create role
        </Button>
      </form>
    </Form>
  );
}
