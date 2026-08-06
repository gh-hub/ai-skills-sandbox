import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";
import type { GrantUserRoleRequest } from "@thanks-claude/shared-types";

export class GrantRoleDto implements GrantUserRoleRequest {
  @ApiProperty()
  @IsUUID()
  roleId!: string;
}
