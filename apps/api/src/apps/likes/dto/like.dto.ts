import { ApiProperty } from "@nestjs/swagger";
import type { Like, LikeCount, LikeFeedItem } from "@thanks-claude/shared-types";
import { AwardSummaryDto } from "../../awards/dto/award-summary.dto";

export class LikeDto implements Like {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty({ nullable: true, type: String })
  story!: string | null;

  @ApiProperty({ nullable: true, type: Number })
  hoursSaved!: number | null;

  @ApiProperty({ type: [AwardSummaryDto] })
  awards!: AwardSummaryDto[];
}

export class LikeCountDto implements LikeCount {
  @ApiProperty()
  count!: number;
}

export class LikeFeedItemDto extends LikeDto implements LikeFeedItem {
  @ApiProperty({ nullable: true, type: String })
  attributedUserName!: string | null;
}
