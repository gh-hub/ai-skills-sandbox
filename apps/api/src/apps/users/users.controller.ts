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
import { ApiOkResponse } from "@nestjs/swagger";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UsersService } from "./users.service";
import { GetUsersQueryDto } from "./dto/get-users-query.dto";
import { GrantRoleDto } from "./dto/grant-role.dto";
import { UsersPageDto } from "./dto/users-page.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @ApiOkResponse({ type: UsersPageDto })
  async getPage(@Query() query: GetUsersQueryDto): Promise<UsersPageDto> {
    return this.usersService.getPage(query);
  }

  @Post(":userId/roles")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @HttpCode(204)
  async grantRole(
    @Param("userId", ParseUUIDPipe) userId: string,
    @Body() dto: GrantRoleDto,
  ): Promise<void> {
    await this.usersService.grantRole(userId, dto.roleId);
  }

  @Delete(":userId/roles/:roleId")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @HttpCode(204)
  async revokeRole(
    @Param("userId", ParseUUIDPipe) userId: string,
    @Param("roleId", ParseUUIDPipe) roleId: string,
  ): Promise<void> {
    await this.usersService.revokeRole(userId, roleId);
  }
}
