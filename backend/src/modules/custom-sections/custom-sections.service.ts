import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CustomSectionsRepository } from './repository/custom-sections.repository';
import { CreateCustomSectionDto } from './dto/create-section.dto';
import { CreateCustomItemDto } from './dto/create-item.dto';
import { UserRoles } from '../../utils/types';

@Injectable()
export class CustomSectionsService {
  constructor(private readonly repository: CustomSectionsRepository) {}

  async createSection(userId: number, dto: CreateCustomSectionDto) {
    return this.repository.createSection(userId, dto);
  }

  async findUserSections(userId: number) {
    return this.repository.findSectionsByUser(userId);
  }

  async findSectionById(id: number) {
    const section = await this.repository.findSectionById(id);
    if (!section) throw new NotFoundException('Section not found');
    return section;
  }

  async updateSection(
    id: number,
    dto: Partial<CreateCustomSectionDto>,
    userId: number,
    role: number,
  ) {
    const section = await this.findSectionById(id);
    if (section.user_id !== userId && role !== UserRoles.SYSADMIN) {
      throw new ForbiddenException('Acesso negado');
    }
    return this.repository.updateSection(id, dto);
  }

  async deleteSection(id: number, userId: number, role: number) {
    const section = await this.findSectionById(id);
    if (section.user_id !== userId && role !== UserRoles.SYSADMIN) {
      throw new ForbiddenException('Acesso negado');
    }
    return this.repository.deleteSection(id);
  }

  async createItem(
    sectionId: number,
    dto: CreateCustomItemDto,
    userId: number,
    role: number,
  ) {
    const section = await this.findSectionById(sectionId);
    if (section.user_id !== userId && role !== UserRoles.SYSADMIN) {
      throw new ForbiddenException('Acesso negado');
    }

    this.validateItemDataAgainstSchema(dto.data, section.field_schema);

    return this.repository.createItem(sectionId, dto);
  }

  async updateItem(
    itemId: number,
    dto: Partial<CreateCustomItemDto>,
    userId: number,
    role: number,
  ) {
    const item = await this.repository.findItemById(itemId);
    if (!item) throw new NotFoundException('Item not found');

    if (item.section.user_id !== userId && role !== UserRoles.SYSADMIN) {
      throw new ForbiddenException('Acesso negado');
    }

    if (dto.data) {
      this.validateItemDataAgainstSchema(dto.data, item.section.field_schema);
    }

    return this.repository.updateItem(itemId, dto);
  }

  async deleteItem(itemId: number, userId: number, role: number) {
    const item = await this.repository.findItemById(itemId);
    if (!item) throw new NotFoundException('Item not found');

    if (item.section.user_id !== userId && role !== UserRoles.SYSADMIN) {
      throw new ForbiddenException('Acesso negado');
    }

    return this.repository.deleteItem(itemId);
  }

  private validateItemDataAgainstSchema(
    data: Record<string, any>,
    schemaData: any,
  ) {
    const schema = Array.isArray(schemaData) ? schemaData : [];

    for (const field of schema) {
      const { key, required } = field;
      if (
        required &&
        (data[key] === undefined || data[key] === null || data[key] === '')
      ) {
        throw new BadRequestException(`Field '${key}' is required.`);
      }
    }
  }
}
