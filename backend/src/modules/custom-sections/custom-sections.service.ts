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
import { assertExactIdSet } from '../../common/validators/assert-exact-id-set';
import { parseContentState } from '../../common/content-state';

@Injectable()
export class CustomSectionsService {
  constructor(private readonly repository: CustomSectionsRepository) {}

  async createSection(userId: number, dto: CreateCustomSectionDto) {
    return this.repository.createSection(userId, dto);
  }

  async findUserSections(userId: number, state?: string) {
    return this.repository.findSectionsByUser(userId, parseContentState(state));
  }

  async findSectionItems(
    sectionId: number,
    userId: number,
    role: number,
    state?: string,
  ) {
    await this.requireSection(sectionId, userId, role);
    return this.repository.findItemsBySection(sectionId, parseContentState(state));
  }

  async reorderSections(userId: number, ids: number[]) {
    const ownedIds = await this.repository.findSectionIdsByUser(userId);
    assertExactIdSet(ownedIds, ids);
    await this.repository.reorderSections(ids);
    return this.repository.findSectionsByUser(userId);
  }

  async reorderItems(
    sectionId: number,
    ids: number[],
    userId: number,
    role: number,
  ) {
    const section = await this.findSectionById(sectionId);
    if (section.user_id !== userId && role !== UserRoles.SYSADMIN) {
      throw new ForbiddenException('Acesso negado');
    }
    const ownedIds = await this.repository.findItemIdsBySection(sectionId);
    assertExactIdSet(ownedIds, ids);
    await this.repository.reorderItems(ids);
    return this.findSectionById(sectionId);
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
    await this.requireSection(id, userId, role);
    return this.repository.softDeleteSection(id);
  }

  async archiveSection(id: number, userId: number, role: number) {
    await this.requireSection(id, userId, role);
    return this.repository.archiveSection(id);
  }

  async unarchiveSection(id: number, userId: number, role: number) {
    await this.requireSection(id, userId, role);
    return this.repository.unarchiveSection(id);
  }

  async restoreSection(id: number, userId: number, role: number) {
    await this.requireSection(id, userId, role);
    return this.repository.restoreSection(id);
  }

  async purgeSection(id: number, userId: number, role: number) {
    const section = await this.requireSection(id, userId, role);
    if (!section.deleted_at) throw new NotFoundException('Section not found');
    return this.repository.deleteSection(id);
  }

  private async requireSection(id: number, userId: number, role: number) {
    const section = await this.findSectionById(id);
    if (section.user_id !== userId && role !== UserRoles.SYSADMIN) {
      throw new ForbiddenException('Acesso negado');
    }
    return section;
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
    await this.requireItem(itemId, userId, role);
    return this.repository.softDeleteItem(itemId);
  }

  async archiveItem(itemId: number, userId: number, role: number) {
    await this.requireItem(itemId, userId, role);
    return this.repository.archiveItem(itemId);
  }

  async unarchiveItem(itemId: number, userId: number, role: number) {
    await this.requireItem(itemId, userId, role);
    return this.repository.unarchiveItem(itemId);
  }

  async restoreItem(itemId: number, userId: number, role: number) {
    await this.requireItem(itemId, userId, role);
    return this.repository.restoreItem(itemId);
  }

  async purgeItem(itemId: number, userId: number, role: number) {
    const item = await this.requireItem(itemId, userId, role);
    if (!item.deleted_at) throw new NotFoundException('Item not found');
    return this.repository.deleteItem(itemId);
  }

  private async requireItem(itemId: number, userId: number, role: number) {
    const item = await this.repository.findItemById(itemId);
    if (!item) throw new NotFoundException('Item not found');
    if (item.section.user_id !== userId && role !== UserRoles.SYSADMIN) {
      throw new ForbiddenException('Acesso negado');
    }
    return item;
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
