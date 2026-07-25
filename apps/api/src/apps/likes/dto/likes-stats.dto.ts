import { ApiProperty } from "@nestjs/swagger";
import type { LikesStats } from "@thanks-claude/shared-types";

export class LikesStatsDto implements LikesStats {
  @ApiProperty()
  totalLikes!: number;

  @ApiProperty()
  likesWithHoursReported!: number;

  @ApiProperty()
  reportedHoursSaved!: number;

  @ApiProperty()
  percentWithoutHoursReported!: number;

  @ApiProperty()
  averageHoursPerReport!: number;

  @ApiProperty()
  estimatedTotalHoursSaved!: number;
}
