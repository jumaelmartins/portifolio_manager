import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CoursesRepository } from './repository/courses.repository';
import { UserRoles } from '../../utils/types';

@Injectable()
export class CoursesService {
  constructor(private coursesRepository: CoursesRepository) {}

  async create(data: CreateCourseDto, userId: number) {
    return await this.coursesRepository.create({ ...data, f_userId: userId });
  }

  async findAll(userId: number, role: number) {
    const filterUserId = role === UserRoles.SYSADMIN ? undefined : userId;
    return await this.coursesRepository.findAll(filterUserId);
  }

  async findOne(id: number) {
    const course = await this.coursesRepository.findById(id);
    if (!course) throw new NotFoundException('Course Not Found');
    return course;
  }

  async update(
    id: number,
    data: UpdateCourseDto,
    userId: number,
    role: number,
  ) {
    const course = await this.coursesRepository.findById(id);
    if (!course) throw new NotFoundException('Course Not Found');
    if (course.f_userId !== userId && role !== UserRoles.SYSADMIN) {
      throw new ForbiddenException(
        'You do not have permission to edit this resource',
      );
    }
    return this.coursesRepository.update(id, {
      ...data,
      start_date: data.start_date ? new Date(data.start_date) : undefined,
      end_date: data.end_date ? new Date(data.end_date) : undefined,
    });
  }

  async remove(id: number, userId: number, role: number) {
    const course = await this.coursesRepository.findById(id);
    if (!course) throw new NotFoundException('Course Not Found');
    if (course.f_userId !== userId && role !== UserRoles.SYSADMIN) {
      throw new ForbiddenException(
        'You do not have permission to delete this resource',
      );
    }
    return await this.coursesRepository.delete(id);
  }
}
