import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { Prisma } from '@prisma/client';
import { UpdateProjectDto } from '../dto/update-project.dto';

const projectInclude = {
  category: true,
  technologies: true,
  f_images: true,
} satisfies Prisma.f_projectsInclude;

@Injectable()
export class ProjectRepository {
  constructor(private prismaService: PrismaService) {}

  async create(data: CreateProjectDto, userId: number) {
    return this.prismaService.f_projects.create({
      data: {
        title: data.title,
        description: data.description,
        ...(data.repo_url !== undefined ? { repo_url: data.repo_url } : {}),
        ...(data.live_url !== undefined ? { live_url: data.live_url } : {}),
        d_categoryId: data.d_categoryId,
        ...(data.f_imagesId !== undefined
          ? { f_imagesId: data.f_imagesId }
          : {}),
        f_userId: userId,
        ...(data.technologyIds !== undefined
          ? {
              technologies: {
                connect: data.technologyIds.map((id) => ({ id })),
              },
            }
          : {}),
      },
      include: projectInclude,
    });
  }

  async findAll(userId: number) {
    return this.prismaService.f_projects.findMany({
      where: { f_userId: userId },
      include: projectInclude,
    });
  }

  async findById(id: number, userId: number) {
    return this.prismaService.f_projects.findFirst({
      where: { id, f_userId: userId },
      include: projectInclude,
    });
  }

  async findByTitle(title: string, userId: number) {
    return this.prismaService.f_projects.findFirst({
      where: { title, f_userId: userId },
      include: projectInclude,
    });
  }

  async update(id: number, userId: number, data: UpdateProjectDto) {
    return this.prismaService.f_projects.update({
      where: { id, f_userId: userId },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.repo_url !== undefined ? { repo_url: data.repo_url } : {}),
        ...(data.live_url !== undefined ? { live_url: data.live_url } : {}),
        ...(data.d_categoryId !== undefined
          ? { d_categoryId: data.d_categoryId }
          : {}),
        ...(data.f_imagesId !== undefined
          ? { f_imagesId: data.f_imagesId }
          : {}),
        ...(data.technologyIds !== undefined
          ? {
              technologies: {
                set: data.technologyIds.map((technologyId) => ({
                  id: technologyId,
                })),
              },
            }
          : {}),
      },
      include: projectInclude,
    });
  }

  async delete(id: number, userId: number) {
    return this.prismaService.f_projects.delete({
      where: { id, f_userId: userId },
    });
  }

  async findImageById(id: number) {
    return this.prismaService.f_images.findUnique({
      where: { id },
    });
  }
}
