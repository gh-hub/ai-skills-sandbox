"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLikesFeed } from "@/lib/api-client/likes";

function formatHours(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function StoryCard({
  story,
  hoursSaved,
}: {
  story: string;
  hoursSaved: number | null;
}) {
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border bg-card p-6 text-left">
      <p className="whitespace-pre-wrap">{story}</p>
      {hoursSaved !== null && (
        <p className="text-sm font-medium text-muted-foreground">
          {formatHours(hoursSaved)} hours saved
        </p>
      )}
    </li>
  );
}

function FeedSkeleton() {
  return (
    <ul className="flex flex-col gap-4" aria-hidden="true">
      {[0, 1, 2].map((key) => (
        <li
          key={key}
          className="h-24 animate-pulse rounded-lg border border-border bg-card"
        />
      ))}
    </ul>
  );
}

function pageNumbers(totalPages: number): number[] {
  return Array.from({ length: totalPages }, (_, index) => index + 1);
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="Story feed pages" className="flex flex-wrap items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        Prev
      </Button>

      {pageNumbers(totalPages).map((number) => (
        <Button
          key={number}
          variant={number === page ? "default" : "outline"}
          size="sm"
          aria-current={number === page ? "page" : undefined}
          onClick={() => onChange(number)}
        >
          {number}
        </Button>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </Button>
    </nav>
  );
}

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
            <StoryCard key={item.id} story={item.story ?? ""} hoursSaved={item.hoursSaved} />
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
