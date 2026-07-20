import { f_experience, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CreateExperienceDto } from '../dto/create-experience.dto';
import { Injectable } from '@nestjs/common';
import { ContentState, contentStateWhere } from '../../../common/content-state';

@Injectable()
export class ExperienceRepository {
  constructor(private prismaService: PrismaService) {}

  async create(
    data: CreateExperienceDto & { f_userId: number },
  ): Promise<f_experience> {
    return await this.prismaService.f_experience.create({
      data: {
        tile: data.tile,
        company_name: data.company_name,
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
  ): Promise<f_experience[]> {
    return await this.prismaService.f_experience.findMany({
      where: {
        ...(userId ? { f_userId: userId } : {}),
        ...contentStateWhere(state),
      },
      orderBy: { order: 'asc' },
    });
  }

  async findById(id: number): Promise<f_experience | null> {
    return await this.prismaService.f_experience.findUnique({ where: { id } });
  }

  async update(
    id: number,
    data: Prisma.f_experienceUpdateInput,
  ): Promise<f_experience | null> {
    return await this.prismaService.f_experience.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return await this.prismaService.f_experience.delete({ where: { id } });
  }

  async findIdsByUser(userId: number): Promise<number[]> {
    const rows = await this.prismaService.f_experience.findMany({
      where: { f_userId: userId, archived_at: null, deleted_at: null },
      select: { id: true },
      orderBy: { order: 'asc' },
    });
    return rows.map((row) => row.id);
  }

  async archive(id: number) {
    return this.prismaService.f_experience.update({
      where: { id },
      data: { archived_at: new Date() },
    });
  }

  async unarchive(id: number) {
    return this.prismaService.f_experience.update({
      where: { id },
      data: { archived_at: null },
    });
  }

  async softDelete(id: number) {
    return this.prismaService.f_experience.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async restore(id: number) {
    return this.prismaService.f_experience.update({
      where: { id },
      data: { deleted_at: null },
    });
  }

  async reorder(ids: number[]): Promise<void> {
    await this.prismaService.$transaction(
      ids.map((id, index) =>
        this.prismaService.f_experience.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );
  }
}
