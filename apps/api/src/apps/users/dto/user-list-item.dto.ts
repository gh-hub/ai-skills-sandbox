import { ApiProperty } from "@nestjs/swagger";
import type { UserListItem } from "@thanks-claude/shared-types";
import { UserRoleDto } from "./user-role.dto";

export class UserListItemDto implements UserListItem {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ type: [UserRoleDto] })
  roles!: UserRoleDto[];
}
