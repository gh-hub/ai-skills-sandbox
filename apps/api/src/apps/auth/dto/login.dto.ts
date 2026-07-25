import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";
import type { LoginRequest } from "@thanks-claude/shared-types";

export class LoginDto implements LoginRequest {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  password!: string;
}
