import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateCourseDto } from '../dto/create-course.dto';
import { f_courses } from '@prisma/client';
import { UpdateCourseDto } from '../dto/update-course.dto';

@Injectable()
export class CoursesRepository {
  constructor(private prismaService: PrismaService) {}

  async create(data: CreateCourseDto): Promise<f_courses> {
    return await this.prismaService.f_courses.create({ data });
  }

  async findAll(): Promise<f_courses[] | null> {
    return await this.prismaService.f_courses.findMany();
  }
  async findById(id: number): Promise<f_courses | null> {
    return await this.prismaService.f_courses.findUnique({
      where: { id },
    });
  }
  async delete(id: number) {
    return await this.prismaService.f_courses.delete({
      where: { id },
    });
  }
  async update(id: number, data: UpdateCourseDto): Promise<f_courses> {
    return await this.prismaService.f_courses.update({
      where: { id },
      data,
    });
  }
}
