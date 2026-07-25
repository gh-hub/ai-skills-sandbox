import { ApiProperty } from "@nestjs/swagger";
import type { LikesPage } from "@thanks-claude/shared-types";
import { LikeDto } from "./like.dto";

export class LikesPageDto implements LikesPage {
  @ApiProperty({ type: [LikeDto] })
  items!: LikeDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}
