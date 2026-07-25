import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";
import type { CreateLikeRequest } from "@thanks-claude/shared-types";

export class CreateLikeDto implements CreateLikeRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  story?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  hoursSaved?: number;
}
