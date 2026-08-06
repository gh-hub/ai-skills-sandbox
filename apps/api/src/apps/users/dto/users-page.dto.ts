import { ApiProperty } from "@nestjs/swagger";
import type { UsersPage } from "@thanks-claude/shared-types";
import { UserListItemDto } from "./user-list-item.dto";

export class UsersPageDto implements UsersPage {
  @ApiProperty({ type: [UserListItemDto] })
  items!: UserListItemDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}
