import { f_education, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CreateEducationDto } from '../dto/create-education.dto';
import { Injectable } from '@nestjs/common';
import { ContentState, contentStateWhere } from '../../../common/content-state';

@Injectable()
export class EducationRepository {
  constructor(private prismaService: PrismaService) {}

  async create(
    data: CreateEducationDto & { f_userId: number },
  ): Promise<f_education> {
    return await this.prismaService.f_education.create({
      data: {
        title: data.title,
        institution_name: data.institution_name,
        description: data.description,
        start_date: new Date(data.start_date),
        end_date: data.end_date ? new Date(data.end_date) : null,
        current: data.current ?? false,
        f_userId: data.f_userId,
      },
    });
  }

  async findAll(
    userId?: number,
    state: ContentState = 'active',
  ): Promise<f_education[]> {
    return await this.prismaService.f_education.findMany({
      where: {
        ...(userId ? { f_userId: userId } : {}),
        ...contentStateWhere(state),
      },
      orderBy: { order: 'asc' },
    });
  }

  async findById(id: number): Promise<f_education | null> {
    return await this.prismaService.f_education.findUnique({ where: { id } });
  }

  async update(
    id: number,
    data: Prisma.f_educationUpdateInput,
  ): Promise<f_education | null> {
    return await this.prismaService.f_education.update({ where: { id }, data });
  }

  async delete(id: number) {
    return await this.prismaService.f_education.delete({ where: { id } });
  }

  async findIdsByUser(userId: number): Promise<number[]> {
    const rows = await this.prismaService.f_education.findMany({
      where: { f_userId: userId, archived_at: null, deleted_at: null },
      select: { id: true },
      orderBy: { order: 'asc' },
    });
    return rows.map((row) => row.id);
  }

  async archive(id: number) {
    return this.prismaService.f_education.update({
      where: { id },
      data: { archived_at: new Date() },
    });
  }

  async unarchive(id: number) {
    return this.prismaService.f_education.update({
      where: { id },
      data: { archived_at: null },
    });
  }

  async softDelete(id: number) {
    return this.prismaService.f_education.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async restore(id: number) {
    return this.prismaService.f_education.update({
      where: { id },
      data: { deleted_at: null },
    });
  }

  async reorder(ids: number[]): Promise<void> {
    await this.prismaService.$transaction(
      ids.map((id, index) =>
        this.prismaService.f_education.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );
  }
}
