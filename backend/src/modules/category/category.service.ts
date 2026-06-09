import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { d_category } from '@prisma/client';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryRepository } from './repository/category.repository';

@Injectable()
export class CategoryService {
  constructor(private categoryRepository: CategoryRepository) {}

  async create(data: CreateCategoryDto): Promise<d_category | null> {
    const { category } = data;
    const categoryExist = await this.categoryRepository.findByCategory(
      category.toLowerCase(),
    );
    if (categoryExist) {
      throw new ConflictException('Category already exist');
    }
    const newCategory = await this.categoryRepository.create({
      category: category.toLowerCase(),
    });
    return newCategory;
  }

  async findAll(): Promise<d_category[] | null> {
    return this.categoryRepository.findAll();
  }

  async findOne(id: number): Promise<d_category> {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundException('Invalid Category');
    }
    return category;
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<d_category | null> {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundException('Invalid Category');
    }
    const updateCategory = await this.categoryRepository.update(id, {
      category: updateCategoryDto.category.toLowerCase(),
    });

    return updateCategory;
  }

  async remove(id: number) {
    await this.categoryRepository.delete(id);
  }
}
