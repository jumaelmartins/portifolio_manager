import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { d_category } from '@prisma/client';
import { UpdateCategoryDto } from '../dto/update-category.dto';

@Injectable()
export class CategoryRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCategoryDto): Promise<d_category | null> {
    return await this.prisma.d_category.create({
      data: { ...data, category: data.category.toLowerCase() },
    });
  }

  async findAll() {
    return await this.prisma.d_category.findMany();
  }

  async findById(id: number): Promise<d_category | null> {
    return await this.prisma.d_category.findUnique({ where: { id } });
  }
  async findByCategory(category: string): Promise<d_category | null> {
    return await this.prisma.d_category.findFirst({
      where: { category: category.toLowerCase() },
    });
  }

  async update(
    id: number,
    updatedCategory: UpdateCategoryDto,
  ): Promise<d_category> {
    return await this.prisma.d_category.update({
      where: { id },
      data: {
        ...updatedCategory,
        category: updatedCategory.category.toLowerCase(),
      },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.d_category.delete({ where: { id } });
  }
}
