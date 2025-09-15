import { f_education, Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { CreateEducationDto } from '../dto/create-education.dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EducationRepository {
  constructor(private prismaService: PrismaService) {}

  async create(data: CreateEducationDto): Promise<f_education> {
    return await this.prismaService.f_education.create({
      data: {
        ...data,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
      },
    });
  }

  async findAll(): Promise<f_education[] | null> {
    return await this.prismaService.f_education.findMany();
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
}
