import { ApiProperty } from "@nestjs/swagger";
import type { Role } from "@thanks-claude/shared-types";

export class RoleDto implements Role {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  isBuiltIn!: boolean;
}
