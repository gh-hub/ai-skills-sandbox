import { AwardBadgeList, type StoryAward } from "@/components/award-badge";
import { StoryByline } from "@/components/story-byline";

function formatHours(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

export function StoryCard({
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
