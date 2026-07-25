"use client";

import { Button } from "@/components/ui/button";
import { useLikesStats } from "@/lib/api-client/likes";

function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card p-6 text-center"
    >
      <span className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {value}
      </span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

function StatsBandSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" aria-hidden="true">
      {[0, 1, 2, 3].map((key) => (
        <div
          key={key}
          className="h-28 animate-pulse rounded-lg border border-border bg-card"
        />
      ))}
    </div>
  );
}

export function StatsBand() {
  const stats = useLikesStats();

  return (
    <section aria-label="Impact stats" className="flex flex-col gap-6">
      <h2 className="text-center text-sm font-medium text-muted-foreground">
        Our impact so far
      </h2>

      {stats.isError && (
        <p role="alert" className="text-center text-sm text-destructive">
          Unable to load stats.{" "}
          <Button onClick={() => stats.refetch()} variant="link" size="sm">
            Retry
          </Button>
        </p>
      )}

      {!stats.isError && (stats.isLoading || stats.data === undefined) && (
        <StatsBandSkeleton />
      )}

      {!stats.isError &&
        stats.data !== undefined &&
        stats.data.totalLikes === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            No likes yet — be the first to say thanks.
          </p>
        )}

      {!stats.isError && stats.data !== undefined && stats.data.totalLikes > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile
            value={formatNumber(stats.data.totalLikes)}
            label="Total likes"
          />
          <StatTile
            value={formatNumber(stats.data.reportedHoursSaved)}
            label="Reported hours saved"
          />
          <StatTile
            value={formatNumber(stats.data.estimatedTotalHoursSaved)}
            label="Estimated total hours saved"
          />
          <StatTile
            value={`${formatNumber(stats.data.percentWithoutHoursReported)}%`}
            label="Didn't report hours"
          />
        </div>
      )}
    </section>
  );
}
