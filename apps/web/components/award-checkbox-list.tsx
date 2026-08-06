"use client";

import { Button } from "@/components/ui/button";
import { useAwards } from "@/lib/api-client/awards";
import { getAwardIcon } from "@/lib/utils";

function toggleAwardId(selectedIds: string[], awardId: string, isChecked: boolean): string[] {
  return isChecked
    ? [...selectedIds, awardId]
    : selectedIds.filter((id) => id !== awardId);
}

export function AwardCheckboxList({
  selectedIds,
  onChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const awards = useAwards();

  if (awards.isError) {
    return (
      <span role="alert" className="text-sm text-destructive">
        Unable to load awards.{" "}
        <Button onClick={() => awards.refetch()} variant="link" size="sm">
          Retry
        </Button>
      </span>
    );
  }

  if (awards.isLoading || awards.data === undefined) {
    return <span className="text-sm text-muted-foreground">loading…</span>;
  }

  if (awards.data.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {awards.data.map((award) => (
        <label
          key={award.id}
          className="flex items-center gap-2 text-sm text-foreground"
        >
          <input
            type="checkbox"
            checked={selectedIds.includes(award.id)}
            onChange={(event) =>
              onChange(toggleAwardId(selectedIds, award.id, event.target.checked))
            }
            className="size-4 rounded border-border"
          />
          <span aria-hidden="true">{getAwardIcon(award.icon)}</span>
          <span>{award.title}</span>
        </label>
      ))}
    </div>
  );
}
