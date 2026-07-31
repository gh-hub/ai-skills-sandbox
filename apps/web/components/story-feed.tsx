"use client";

import { useState } from "react";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { useLikesFeed } from "@/lib/api-client/likes";
import { getAwardIcon } from "@/lib/utils";

type StoryAward = {
  id: string;
  title: string;
  icon: string | null;
};

function formatHours(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function AwardBadge({ award }: { award: StoryAward }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground">
      <span aria-hidden="true">{getAwardIcon(award.icon)}</span>
      <span>{award.title}</span>
    </span>
  );
}

function AwardBadgeList({ awards }: { awards: StoryAward[] }) {
  if (awards.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Awards">
      {awards.map((award) => (
        <li key={award.id}>
          <AwardBadge award={award} />
        </li>
      ))}
    </ul>
  );
}

function StoryByline({ attributedUserName }: { attributedUserName: string | null }) {
  if (attributedUserName === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <UserRound className="size-6 shrink-0" aria-hidden="true" />
        <span>Anonymous</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <UserAvatar name={attributedUserName} size="sm" />
      <span>{attributedUserName}</span>
    </div>
  );
}

function StoryCard({
  story,
  hoursSaved,
  attributedUserName,
  awards,
}: {
  story: string;
  hoursSaved: number | null;
  attributedUserName: string | null;
  awards: StoryAward[];
}) {
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border bg-card p-6 text-left">
      <StoryByline attributedUserName={attributedUserName} />
      <p className="whitespace-pre-wrap">{story}</p>
      {hoursSaved !== null && (
        <p className="text-sm font-medium text-muted-foreground">
          {formatHours(hoursSaved)} hours saved
        </p>
      )}
      <AwardBadgeList awards={awards} />
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
