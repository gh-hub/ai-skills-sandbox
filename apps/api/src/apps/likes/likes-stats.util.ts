import type { LikesStats } from "@thanks-claude/shared-types";

export type LikesAggregate = {
  totalLikes: number;
  likesWithHoursReported: number;
  reportedHoursSaved: number;
};

export function computeLikesStats({
  totalLikes,
  likesWithHoursReported,
  reportedHoursSaved,
}: LikesAggregate): LikesStats {
  const percentWithoutHoursReported =
    totalLikes === 0 ? 0 : ((totalLikes - likesWithHoursReported) / totalLikes) * 100;

  const averageHoursPerReport =
    likesWithHoursReported === 0 ? 0 : reportedHoursSaved / likesWithHoursReported;

  const estimatedTotalHoursSaved = averageHoursPerReport * totalLikes;

  return {
    totalLikes,
    likesWithHoursReported,
    reportedHoursSaved,
    percentWithoutHoursReported,
    averageHoursPerReport,
    estimatedTotalHoursSaved,
  };
}
