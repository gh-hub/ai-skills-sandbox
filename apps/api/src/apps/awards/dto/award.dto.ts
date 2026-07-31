import { ApiProperty } from "@nestjs/swagger";
import type { Award } from "@thanks-claude/shared-types";

export class AwardDto implements Award {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ nullable: true, type: String })
  icon!: string | null;

  @ApiProperty()
  givenCount!: number;
}
