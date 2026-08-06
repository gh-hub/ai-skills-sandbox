import { Injectable, NotFoundException } from "@nestjs/common";
import type { Award } from "@thanks-claude/shared-types";
import { AwardsRepository } from "./awards.repository";
import { CreateAwardDto } from "./dto/create-award.dto";
import { UpdateAwardDto } from "./dto/update-award.dto";
import { toAwardDto } from "./awards.util";

@Injectable()
export class AwardsService {
  constructor(private readonly awardsRepository: AwardsRepository) {}

  async getAll(): Promise<Award[]> {
    const rows = await this.awardsRepository.findAll();
    return rows.map(toAwardDto);
  }

  async getById(id: string): Promise<Award> {
    const row = await this.awardsRepository.findById(id);
    if (!row) {
      throw new NotFoundException(`Award ${id} not found`);
    }

    return toAwardDto(row);
  }

  async create(dto: CreateAwardDto): Promise<Award> {
    const award = await this.awardsRepository.insertAward(dto);
    return toAwardDto({ ...award, givenCount: 0 });
  }

  async update(id: string, dto: UpdateAwardDto): Promise<Award> {
    const updated = await this.awardsRepository.updateAward(id, dto);
    if (!updated) {
      throw new NotFoundException(`Award ${id} not found`);
    }

    return this.getById(id);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.awardsRepository.deleteAward(id);
    if (!deleted) {
      throw new NotFoundException(`Award ${id} not found`);
    }
  }
}
