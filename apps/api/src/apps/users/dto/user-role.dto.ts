import { ApiProperty } from "@nestjs/swagger";
import type { UserRoleSummary } from "@thanks-claude/shared-types";

export class UserRoleDto implements UserRoleSummary {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}
