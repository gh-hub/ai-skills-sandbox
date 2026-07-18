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
    <main>
      <h1>Thanks, Claude</h1>

      {likeSubmit.isError && (
        <p role="alert">Couldn't submit your like. Please try again.</p>
      )}

      <p>
        <Button onClick={() => likeSubmit.mutate({})} disabled={likeSubmit.isPending}>
          Like
        </Button>{" "}
        {likeCount.isError ? (
          <span role="alert">
            Unable to load like count.{" "}
            <button onClick={() => likeCount.refetch()}>Retry</button>
          </span>
        ) : likeCount.isLoading || likeCount.data === undefined ? (
          "loading…"
        ) : (
          `${likeCount.data} likes`
        )}
      </p>

      <Button onClick={() => setIsExpanded((prev) => !prev)}>
        {isExpanded ? "Hide story" : "Share a story"}
      </Button>

      {isExpanded && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleStorySubmit)}>
            {storySubmit.isError && (
              <p role="alert">Couldn't submit your story. Please try again.</p>
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
    </main>
  );
}
