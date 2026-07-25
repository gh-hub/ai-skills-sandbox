import { ApiProperty } from "@nestjs/swagger";
import type { MeResponse } from "@thanks-claude/shared-types";
import { AuthUserDto } from "./auth-user.dto";

export class MeResponseDto implements MeResponse {
  @ApiProperty({ type: AuthUserDto, nullable: true })
  user!: AuthUserDto | null;
}
