"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthModal } from "@/components/auth-modal";
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
import { useMe } from "@/lib/api-client/auth";
import { useAwards, useCreateAward } from "@/lib/api-client/awards";
import { DEFAULT_AWARD_ICON, getAwardIcon } from "@/lib/utils";

const createAwardSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  icon: z.string().optional(),
});

type CreateAwardValues = z.infer<typeof createAwardSchema>;

function AwardsListSkeleton() {
  return (
    <ul className="flex flex-col gap-4" aria-hidden="true">
      {[0, 1, 2].map((key) => (
        <li
          key={key}
          className="h-20 animate-pulse rounded-lg border border-border bg-card"
        />
      ))}
    </ul>
  );
}

function AwardsList() {
  const awards = useAwards();

  if (awards.isError) {
    return (
      <p role="alert" className="text-center text-sm text-destructive">
        Unable to load awards.{" "}
        <Button onClick={() => awards.refetch()} variant="link" size="sm">
          Retry
        </Button>
      </p>
    );
  }

  if (awards.isLoading || awards.data === undefined) {
    return <AwardsListSkeleton />;
  }

  if (awards.data.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        No awards yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {awards.data.map((award) => (
        <li
          key={award.id}
          className="flex items-start gap-4 rounded-lg border border-border bg-card p-6 text-left"
        >
          <span className="text-2xl" aria-hidden="true">
            {getAwardIcon(award.icon)}
          </span>
          <div className="flex flex-col gap-1">
            <h3 className="font-medium text-foreground">{award.title}</h3>
            <p className="text-sm text-muted-foreground">
              {award.description}
            </p>
            <p className="text-sm text-muted-foreground">
              {award.givenCount} given
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CreateAwardForm() {
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

function LoginPrompt() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 text-center">
      <p className="text-sm text-muted-foreground">
        Log in to create an award.
      </p>
      <AuthModal />
    </div>
  );
}

function CreateAwardSection() {
  const me = useMe();

  if (me.isLoading || me.data === undefined) {
    return null;
  }

  if (me.data === null) {
    return <LoginPrompt />;
  }

  return <CreateAwardForm />;
}

export default function AwardsPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-16">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Awards</h1>
        <p className="text-muted-foreground">
          Badges the community gives out alongside their thanks.
        </p>
      </div>

      <section aria-label="Awards list" className="flex flex-col gap-4">
        <AwardsList />
      </section>

      <CreateAwardSection />
    </main>
  );
}
