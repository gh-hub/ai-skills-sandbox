"use client";

import { Button } from "@/components/ui/button";
import { useAwards } from "@/lib/api-client/awards";
import { getAwardIcon } from "@/lib/utils";

export function AwardsListSkeleton() {
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

export function AwardsList() {
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
