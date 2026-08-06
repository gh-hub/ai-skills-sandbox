import { getAwardIcon } from "@/lib/utils";

export type StoryAward = {
  id: string;
  title: string;
  icon: string | null;
};

export function AwardBadge({ award }: { award: StoryAward }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground">
      <span aria-hidden="true">{getAwardIcon(award.icon)}</span>
      <span>{award.title}</span>
    </span>
  );
}

export function AwardBadgeList({ awards }: { awards: StoryAward[] }) {
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
