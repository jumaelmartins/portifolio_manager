import { ConflictException, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/database/prisma.service';
import { Prisma, d_category } from '@prisma/client';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.d_categoryCreateInput): Promise<d_category> {
    const { category } = data;

    const categoryExist = await this.prisma.d_category.findUnique({
      where: {
        category: category.toLowerCase(),
      },
    });

    if (categoryExist) {
      throw new ConflictException('Category already exist');
    }

    const newCategory = await this.prisma.d_category.create({
      data: { category: category.toLowerCase() },
    });

    return newCategory;
  }

  async findAll(): Promise<d_category[]> {
    return this.prisma.d_category.findMany();
  }

  async findOne(id: number): Promise<d_category> {
    const category = await this.prisma.d_category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new Error('Invalid Category');
    }
    return category;
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<d_category> {
    const category = await this.prisma.d_category.findUnique({ where: { id } });

    if (!category) {
      throw new Error('Invalid Category');
    }
    const updateCategory = await this.prisma.d_category.update({
      where: { id },
      data: {
        category: updateCategoryDto.category.toLowerCase(),
      },
    });

    return updateCategory;
  }

  async remove(id: number) {
    await this.prisma.d_category.delete({ where: { id } });

    return null;
  }
}
