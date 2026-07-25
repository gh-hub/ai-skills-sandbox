"use client";

import { useState } from "react";
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
import { SparkMark } from "@/components/spark-mark";
import { StatsBand } from "@/components/stats-band";
import { StoryFeed } from "@/components/story-feed";
import { useLikeCount, useSubmitLike } from "@/lib/api-client/likes";

const storyFormSchema = z.object({
  story: z.string().optional(),
  hoursSaved: z
    .string()
    .optional()
    .refine((value) => !value || value.trim() === "" || Number(value) >= 0, {
      message: "Hours saved must be zero or greater",
    }),
});

type StoryFormValues = z.infer<typeof storyFormSchema>;

function renderLikeCount(likeCount: ReturnType<typeof useLikeCount>) {
  if (likeCount.isError) {
    return (
      <span role="alert">
        Unable to load like count.{" "}
        <Button onClick={() => likeCount.refetch()} variant="link" size="sm">
          Retry
        </Button>
      </span>
    );
  }

  if (likeCount.isLoading || likeCount.data === undefined) {
    return "loading…";
  }

  return `${likeCount.data} likes`;
}

export default function Home() {
  const [isExpanded, setIsExpanded] = useState(false);

  const likeCount = useLikeCount();
  const likeSubmit = useSubmitLike();
  const storySubmit = useSubmitLike();

  const form = useForm<StoryFormValues>({
    resolver: zodResolver(storyFormSchema),
    defaultValues: { story: "", hoursSaved: "" },
  });

  const handleStorySubmit = (values: StoryFormValues) => {
    const trimmedStory = values.story?.trim();
    const trimmedHours = values.hoursSaved?.trim();

    storySubmit.mutate(
      {
        story: trimmedStory ? trimmedStory : undefined,
        hoursSaved: trimmedHours ? Number(trimmedHours) : undefined,
      },
      {
        onSuccess: () => {
          form.reset();
          setIsExpanded(false);
        },
      }
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-20 text-center sm:py-28">
          <SparkMark size={48} />

          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Thanks, Claude
          </h1>

          <p className="max-w-md text-balance text-muted-foreground">
            A small way to say thank you — and to see how much time Claude
            has given back to people like you.
          </p>

          {likeSubmit.isError && (
            <p role="alert" className="text-sm text-destructive">
              Couldn&apos;t submit your like. Please try again.
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button
              onClick={() => likeSubmit.mutate({})}
              disabled={likeSubmit.isPending}
              size="lg"
            >
              Like
            </Button>
            <span className="text-sm text-muted-foreground">
              {renderLikeCount(likeCount)}
            </span>
          </div>

          <div className="w-full max-w-md">
            <Button
              onClick={() => setIsExpanded((prev) => !prev)}
              variant="outline"
            >
              {isExpanded ? "Hide story" : "Share a story"}
            </Button>

            {isExpanded && (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleStorySubmit)}
                  className="mt-4 flex flex-col gap-4 rounded-lg border border-border bg-card p-6 text-left shadow-xs"
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
                  <Button type="submit" disabled={storySubmit.isPending}>
                    Submit
                  </Button>
                </form>
              </Form>
            )}
          </div>
        </section>

        <div
          id="stats-and-feed"
          className="mx-auto flex max-w-4xl flex-col gap-16 px-6 pb-20"
        >
          <StatsBand />
          <StoryFeed />
        </div>
      </main>

      <footer className="border-t border-border bg-card/50 py-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-6 text-center text-sm text-muted-foreground">
          <SparkMark size={20} />
          <p>Thanks, Claude — an independent appreciation project.</p>
          <p>Not affiliated with or endorsed by Anthropic.</p>
        </div>
      </footer>
    </div>
  );
}
