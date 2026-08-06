import { ApiProperty } from "@nestjs/swagger";
import type { AwardSummary } from "@thanks-claude/shared-types";

export class AwardSummaryDto implements AwardSummary {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ nullable: true, type: String })
  icon!: string | null;
}
