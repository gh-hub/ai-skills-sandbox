import { ApiProperty } from "@nestjs/swagger";
import type { RoleAffectedUser, RoleInUseResponse } from "@thanks-claude/shared-types";

export class RoleAffectedUserDto implements RoleAffectedUser {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;
}

export class RoleInUseDto implements RoleInUseResponse {
  @ApiProperty()
  message!: string;

  @ApiProperty({ type: [RoleAffectedUserDto] })
  affectedUsers!: RoleAffectedUserDto[];
}
