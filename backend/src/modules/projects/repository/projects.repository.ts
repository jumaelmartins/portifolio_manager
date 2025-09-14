import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { f_projects } from '@prisma/client';
import { UpdateProjectDto } from '../dto/update-project.dto';

export interface ProjectWithImageAndCategory {
  id: number;
  title: string;
  description: string;  
  repo_url?: string | null;
  live_url?: string | null;
  created_at: Date;
  updated_at: Date;
  f_images?: {
    id: number;
    src_path: string;
  } | null;
  category: {
    id: number;
    category: string;
  };
}

@Injectable()
export class ProjectRepository {
  constructor(private prismaService: PrismaService) {}

  async create(data: CreateProjectDto): Promise<f_projects> {
    return await this.prismaService.f_projects.create({data})
  }

  async findAll(): Promise<ProjectWithImageAndCategory[] | null> {
    return await this.prismaService.f_projects.findMany(

      {
        select: {
          id: true,
          title: true,
          description: true,
          repo_url: true,
          live_url: true,
          created_at: true,
          updated_at: true,
          f_images:{
            select:{
              id:true,
              src_path:true,
          }
        },
          category: {
            select: {
              id: true,
              category: true
            }
          }
        }
      }
    )
  }

  async findById(id: number): Promise<ProjectWithImageAndCategory | null> {
    return await this.prismaService.f_projects.findUnique({
      where: { id },
      include: {
        f_images: true,
        category: true
      }
    });
  }
  async findByTitle(title: string): Promise<ProjectWithImageAndCategory | null> {
    return await this.prismaService.f_projects.findUnique({
      where: { title },
      include: {
        f_images: true,
        category: true
      }
    });
  }

  async update(id: number, data: UpdateProjectDto): Promise<ProjectWithImageAndCategory> {
    return await this.prismaService.f_projects.update({
      where: { id },
      data,
      include: {
        f_images: true,
        category: true
      }
    });
  }

  async delete(id: number): Promise<f_projects> {
    return await this.prismaService.f_projects.delete({
      where: { id },
    });
  }

}
