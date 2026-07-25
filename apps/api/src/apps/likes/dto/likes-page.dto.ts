import { ApiProperty } from "@nestjs/swagger";
import type { LikesPage } from "@thanks-claude/shared-types";
import { LikeFeedItemDto } from "./like.dto";

export class LikesPageDto implements LikesPage {
  @ApiProperty({ type: [LikeFeedItemDto] })
  items!: LikeFeedItemDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}
