import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse } from "@nestjs/swagger";
import type { Role } from "@thanks-claude/shared-types";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { RolesService } from "./roles.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { DeleteRoleQueryDto } from "./dto/delete-role-query.dto";
import { RoleDto } from "./dto/role.dto";

@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @ApiOkResponse({ type: [RoleDto] })
  async getAll(): Promise<Role[]> {
    return this.rolesService.getAll();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @ApiCreatedResponse({ type: RoleDto })
  async create(@Body() dto: CreateRoleDto): Promise<Role> {
    return this.rolesService.create(dto);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @HttpCode(204)
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @Query() query: DeleteRoleQueryDto,
  ): Promise<void> {
    await this.rolesService.remove(id, query.force);
  }
}
