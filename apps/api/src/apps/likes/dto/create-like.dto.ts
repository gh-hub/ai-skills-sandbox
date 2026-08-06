import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";
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

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  awardIds?: string[];
}
