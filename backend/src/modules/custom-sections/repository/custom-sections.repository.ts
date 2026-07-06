import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateCustomSectionDto } from '../dto/create-section.dto';
import { CreateCustomItemDto } from '../dto/create-item.dto';

@Injectable()
export class CustomSectionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createSection(userId: number, data: CreateCustomSectionDto) {
    return this.prisma.custom_section.create({
      data: {
        ...data,
        field_schema: data.field_schema as any,
        user_id: userId,
      },
    });
  }

  async findSectionsByUser(userId: number) {
    return this.prisma.custom_section.findMany({
      where: { user_id: userId },
      include: { items: { orderBy: { order: 'asc' } } },
      orderBy: { order: 'asc' },
    });
  }

  async findSectionById(id: number) {
    return this.prisma.custom_section.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  async updateSection(id: number, data: Partial<CreateCustomSectionDto>) {
    return this.prisma.custom_section.update({
      where: { id },
      data: {
        ...data,
        field_schema: data.field_schema as any,
      },
    });
  }

  async deleteSection(id: number) {
    return this.prisma.custom_section.delete({ where: { id } });
  }

  async findSectionIdsByUser(userId: number): Promise<number[]> {
    const rows = await this.prisma.custom_section.findMany({
      where: { user_id: userId },
      select: { id: true },
      orderBy: { order: 'asc' },
    });
    return rows.map((row) => row.id);
  }

  async reorderSections(ids: number[]): Promise<void> {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.custom_section.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );
  }

  async createItem(sectionId: number, data: CreateCustomItemDto) {
    return this.prisma.custom_section_item.create({
      data: {
        section_id: sectionId,
        data: data.data,
        order: data.order,
      },
    });
  }

  async findItemById(id: number) {
    return this.prisma.custom_section_item.findUnique({
      where: { id },
      include: { section: true },
    });
  }

  async updateItem(id: number, data: Partial<CreateCustomItemDto>) {
    return this.prisma.custom_section_item.update({
      where: { id },
      data: {
        data: data.data,
        order: data.order,
      },
    });
  }

  async deleteItem(id: number) {
    return this.prisma.custom_section_item.delete({ where: { id } });
  }
}
