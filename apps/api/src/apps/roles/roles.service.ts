import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Role } from "@thanks-claude/shared-types";
import { RolesRepository } from "./roles.repository";
import { CreateRoleDto } from "./dto/create-role.dto";

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async getAll(): Promise<Role[]> {
    return this.rolesRepository.findAll();
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    const existing = await this.rolesRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictException(`Role name "${dto.name}" is already in use`);
    }

    return this.rolesRepository.insert(dto.name);
  }

  async remove(id: string, force: boolean): Promise<void> {
    const role = await this.rolesRepository.findById(id);
    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }

    if (role.isBuiltIn) {
      throw new BadRequestException("Built-in roles cannot be deleted");
    }

    if (force) {
      await this.rolesRepository.deleteById(role.id);
      return;
    }

    await this.removeIfUnassigned(role.id);
  }

  private async removeIfUnassigned(roleId: string): Promise<void> {
    const affectedUsers = await this.rolesRepository.findUsersAssignedToRole(roleId);
    if (affectedUsers.length > 0) {
      throw new ConflictException({
        message: "Role is currently assigned to one or more users",
        affectedUsers,
      });
    }

    await this.rolesRepository.deleteById(roleId);
  }
}
