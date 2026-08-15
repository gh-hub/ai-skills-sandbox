"use client";

import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { HeaderAuthControl } from "@/components/header-auth-control";
import {
  ShareStoryModal,
  storyFormSchema,
  type StoryFormValues,
} from "@/components/share-story-modal";
import { Button } from "@/components/ui/button";
import { SparkMark } from "@/components/spark-mark";
import { StatsBand } from "@/components/stats-band";
import { StoryFeed } from "@/components/story-feed";
import {
  useLikeCount,
  useLikesStats,
  useSubmitLike,
} from "@/lib/api-client/likes";
import { useReportHeroVisibility } from "@/lib/hero-visibility-context";

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

function formatHeroStatNumber(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function renderHeroStatsLine(stats: ReturnType<typeof useLikesStats>) {
  if (stats.isError) {
    return (
      <span role="alert">
        Unable to load stats.{" "}
        <Button
          onClick={() => stats.refetch()}
          variant="link"
          size="sm"
          className="h-auto p-0 font-mono"
        >
          Retry
        </Button>
      </span>
    );
  }

  if (stats.isLoading || stats.data === undefined) {
    return "loading…";
  }

  return `${formatHeroStatNumber(stats.data.totalLikes)} likes · ${formatHeroStatNumber(
    stats.data.estimatedTotalHoursSaved
  )}h saved so far`;
}

export default function Home() {
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const likeCount = useLikeCount();
  const likeSubmit = useSubmitLike();
  const storySubmit = useSubmitLike();
  const heroStats = useLikesStats();
  useReportHeroVisibility(heroRef);

  const form = useForm<StoryFormValues>({
    resolver: zodResolver(storyFormSchema),
    defaultValues: { story: "", hoursSaved: "", awardIds: [] },
  });

  const handleStorySubmit = (values: StoryFormValues) => {
    const trimmedStory = values.story?.trim();
    const trimmedHours = values.hoursSaved?.trim();

    storySubmit.mutate(
      {
        story: trimmedStory ? trimmedStory : undefined,
        hoursSaved: trimmedHours ? Number(trimmedHours) : undefined,
        awardIds: values.awardIds && values.awardIds.length > 0 ? values.awardIds : undefined,
      },
      {
        onSuccess: () => {
          form.reset();
          setIsStoryModalOpen(false);
        },
      }
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 pt-20 sm:pt-28">
          <div className="overflow-hidden rounded-lg border border-border bg-card font-mono text-sm">
            <div
              ref={heroRef}
              className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3"
            >
              <span className="flex gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
              </span>
              <h1 className="text-sm font-medium text-foreground sm:text-base">
                Thanks, Claude (code)
              </h1>
              <div className="ml-auto">
                <HeaderAuthControl />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row">
              <div className="flex flex-1 flex-col gap-4 p-6">
                <p className="text-foreground">Welcome!</p>
                <SparkMark size={40} />
                <p className="text-muted-foreground">
                  {renderHeroStatsLine(heroStats)}
                </p>
                <p className="text-muted-foreground">~/thanks-claude</p>
              </div>

              <div
                aria-hidden="true"
                className="border-t border-border sm:border-t-0 sm:border-l"
              />

              <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="flex flex-col gap-1">
                  <p className="font-medium text-foreground">
                    # Tips for saying thanks
                  </p>
                  <p className="text-muted-foreground">
                    Hit the Like button below, or expand &quot;Share a
                    story&quot; to tell us how Claude helped.
                  </p>
                </div>

                <div aria-hidden="true" className="border-t border-border" />

                <div className="flex flex-col gap-1">
                  <p className="font-medium text-foreground">
                    # What&apos;s new
                  </p>
                  <p className="text-muted-foreground">
                    You can now share your own story alongside a like, and
                    browse stories from others below.
                  </p>
                </div>

                <a
                  href="#stats-and-feed"
                  className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  See stories below ↓
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 pt-10 pb-20 text-center sm:pb-28">
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
              onClick={() => setIsStoryModalOpen(true)}
              variant="outline"
            >
              Share a story
            </Button>

            <ShareStoryModal
              open={isStoryModalOpen}
              onOpenChange={setIsStoryModalOpen}
              form={form}
              storySubmit={storySubmit}
              onSubmit={handleStorySubmit}
            />
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
