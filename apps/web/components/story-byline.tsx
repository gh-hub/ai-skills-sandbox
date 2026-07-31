import { UserRound } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";

export function StoryByline({ attributedUserName }: { attributedUserName: string | null }) {
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
