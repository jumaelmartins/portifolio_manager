import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CoursesRepository } from './repository/courses.repository';

@Injectable()
export class CoursesService {
  constructor(private coursesRepository: CoursesRepository) {}

  async create(data: CreateCourseDto) {
    return await this.coursesRepository.create(data);
  }

  async findAll() {
    return await this.coursesRepository.findAll();
  }

  async findOne(id: number) {
    const course = await this.coursesRepository.findById(id);
    if (!course) {
      throw new NotFoundException('Course Not Found');
    }

    return await this.coursesRepository.findById(id);
  }

  async update(id: number, data: UpdateCourseDto) {
    const course = await this.coursesRepository.findById(id);
    if (!course) {
      throw new NotFoundException('Course Not Found');
    }

    return await this.coursesRepository.update(id, data);
  }

  async remove(id: number) {
    const course = await this.coursesRepository.findById(id);
    if (!course) {
      throw new NotFoundException('Course Not Found');
    }

    return await this.coursesRepository.delete(id);
  }
}
