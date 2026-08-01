import { ApiProperty } from "@nestjs/swagger";
import type { AuthUser } from "@thanks-claude/shared-types";

export class AuthUserDto implements AuthUser {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ type: [String] })
  roles!: string[];
}
