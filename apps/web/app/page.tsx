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
  const submitLike = useSubmitLike();

  const form = useForm<StoryFormValues>({
    resolver: zodResolver(storyFormSchema),
    defaultValues: { story: "", hoursSaved: "" },
  });

  const handleStorySubmit = (values: StoryFormValues) => {
    const trimmedStory = values.story?.trim();
    const trimmedHours = values.hoursSaved?.trim();

    submitLike.mutate(
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

      {likeCount.isError && (
        <p role="alert">Couldn't load the like count. Please refresh the page.</p>
      )}
      {submitLike.isError && (
        <p role="alert">Couldn't submit your like. Please try again.</p>
      )}

      <p>
        <Button onClick={() => submitLike.mutate({})} disabled={submitLike.isPending}>
          Like
        </Button>{" "}
        {likeCount.isLoading || likeCount.data === undefined
          ? "loading…"
          : `${likeCount.data} likes`}
      </p>

      <button onClick={() => setIsExpanded((prev) => !prev)}>
        {isExpanded ? "Hide story" : "Share a story"}
      </button>

      {isExpanded && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleStorySubmit)}>
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
            <Button type="submit" disabled={submitLike.isPending}>
              Submit
            </Button>
          </form>
        </Form>
      )}
    </main>
  );
}
