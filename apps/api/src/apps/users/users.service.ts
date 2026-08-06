import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { RolesRepository, type RoleRow } from "../roles/roles.repository";
import { UsersRepository } from "./users.repository";
import { GetUsersQueryDto } from "./dto/get-users-query.dto";
import { UsersPageDto } from "./dto/users-page.dto";
import { groupRolesByUserId } from "./users-roles.util";

const ADMIN_ROLE_NAME = "ADMIN";

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly rolesRepository: RolesRepository,
  ) {}

  async getPage({ page, limit, search }: GetUsersQueryDto): Promise<UsersPageDto> {
    const offset = (page - 1) * limit;

    const total = await this.usersRepository.countMatching(search);
    const rows = await this.usersRepository.findPage(limit, offset, search);

    const roleRows = await this.usersRepository.findRolesForUserIds(rows.map((row) => row.id));
    const rolesByUserId = groupRolesByUserId(roleRows);

    return {
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        roles: rolesByUserId.get(row.id) ?? [],
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async grantRole(userId: string, roleId: string): Promise<void> {
    await this.getUserOrThrow(userId);
    const role = await this.getRoleOrThrow(roleId);
    this.assertNotAdminRole(role);

    const alreadyHeld = await this.usersRepository.findAssignment(userId, role.id);
    if (alreadyHeld) {
      throw new ConflictException(`User ${userId} already holds role ${role.name}`);
    }

    await this.usersRepository.insertAssignment(userId, role.id);
  }

  async revokeRole(userId: string, roleId: string): Promise<void> {
    await this.getUserOrThrow(userId);
    const role = await this.getRoleOrThrow(roleId);
    this.assertNotAdminRole(role);

    const deleted = await this.usersRepository.deleteAssignment(userId, role.id);
    if (!deleted) {
      throw new NotFoundException(`User ${userId} does not hold role ${role.name}`);
    }
  }

  private async getUserOrThrow(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    return user;
  }

  private async getRoleOrThrow(roleId: string): Promise<RoleRow> {
    const role = await this.rolesRepository.findById(roleId);
    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }

    return role;
  }

  private assertNotAdminRole(role: RoleRow): void {
    if (role.name === ADMIN_ROLE_NAME) {
      throw new BadRequestException("The ADMIN role cannot be granted or revoked through this feature");
    }
  }
}
