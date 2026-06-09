import { f_courses, Prisma } from "@prisma/client";
import { PrismaService } from "../../../database/prisma.service";
import { CreateCourseDto } from "../dto/create-course.dto";
import { Injectable } from "@nestjs/common";

@Injectable()
export class CoursesRepository {
  constructor(private prismaService: PrismaService) {}

  async create(data: CreateCourseDto & { f_userId: number }): Promise<f_courses> {
    return await this.prismaService.f_courses.create({
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

  async findAll(userId?: number): Promise<f_courses[]> {
    return await this.prismaService.f_courses.findMany({
      where: userId ? { f_userId: userId } : undefined,
    });
  }

  async findById(id: number): Promise<f_courses | null> {
    return await this.prismaService.f_courses.findUnique({ where: { id } });
  }

  async update(id: number, data: Prisma.f_coursesUpdateInput): Promise<f_courses> {
    return await this.prismaService.f_courses.update({ where: { id }, data });
  }

  async delete(id: number) {
    return await this.prismaService.f_courses.delete({ where: { id } });
  }
}
