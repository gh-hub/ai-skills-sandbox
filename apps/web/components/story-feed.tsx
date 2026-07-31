"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FeedSkeleton } from "@/components/feed-skeleton";
import { Pagination } from "@/components/pagination";
import { StoryCard } from "@/components/story-card";
import { useLikesFeed } from "@/lib/api-client/likes";

export function StoryFeed() {
  const [page, setPage] = useState(1);
  const feed = useLikesFeed(page);

  return (
    <section aria-label="Story feed" className="flex flex-col gap-6">
      <h2 className="text-center text-sm font-medium text-muted-foreground">
        Stories from the community
      </h2>

      {feed.isError && (
        <p role="alert" className="text-center text-sm text-destructive">
          Unable to load stories.{" "}
          <Button onClick={() => feed.refetch()} variant="link" size="sm">
            Retry
          </Button>
        </p>
      )}

      {!feed.isError && (feed.isLoading || feed.data === undefined) && (
        <FeedSkeleton />
      )}

      {!feed.isError && feed.data !== undefined && feed.data.total === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          No stories yet — be the first to share one.
        </p>
      )}

      {!feed.isError &&
        feed.data !== undefined &&
        feed.data.total > 0 &&
        feed.data.items.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            No stories on this page.
          </p>
        )}

      {!feed.isError && feed.data !== undefined && feed.data.items.length > 0 && (
        <ul className="flex flex-col gap-4">
          {feed.data.items.map((item) => (
            <StoryCard
              key={item.id}
              story={item.story ?? ""}
              hoursSaved={item.hoursSaved}
              attributedUserName={item.attributedUserName}
              awards={item.awards}
            />
          ))}
        </ul>
      )}

      {!feed.isError && feed.data !== undefined && (
        <Pagination
          page={feed.data.page}
          totalPages={feed.data.totalPages}
          onChange={setPage}
        />
      )}
    </section>
  );
}
