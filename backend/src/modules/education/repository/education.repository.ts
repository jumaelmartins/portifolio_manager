import { f_education, Prisma } from "@prisma/client";
import { PrismaService } from "../../../database/prisma.service";
import { CreateEducationDto } from "../dto/create-education.dto";
import { Injectable } from "@nestjs/common";

@Injectable()
export class EducationRepository {
  constructor(private prismaService: PrismaService) {}

  async create(data: CreateEducationDto & { f_userId: number }): Promise<f_education> {
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

  async findAll(userId?: number): Promise<f_education[]> {
    return await this.prismaService.f_education.findMany({
      where: userId ? { f_userId: userId } : undefined,
    });
  }

  async findById(id: number): Promise<f_education | null> {
    return await this.prismaService.f_education.findUnique({ where: { id } });
  }

  async update(id: number, data: Prisma.f_educationUpdateInput): Promise<f_education | null> {
    return await this.prismaService.f_education.update({ where: { id }, data });
  }

  async delete(id: number) {
    return await this.prismaService.f_education.delete({ where: { id } });
  }
}
