import type { AwardSummary } from "@thanks-claude/shared-types";
import type { LikeAwardRow } from "./likes.repository";

export function groupAwardsByLikeId(rows: LikeAwardRow[]): Map<string, AwardSummary[]> {
  const awardsByLikeId = new Map<string, AwardSummary[]>();

  for (const row of rows) {
    const awardsForLike = awardsByLikeId.get(row.likeId) ?? [];
    awardsForLike.push({ id: row.id, title: row.title, icon: row.icon });
    awardsByLikeId.set(row.likeId, awardsForLike);
  }

  return awardsByLikeId;
}
