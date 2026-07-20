import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CoursesRepository } from './repository/courses.repository';
import { UserRoles } from '../../utils/types';
import { assertExactIdSet } from '../../common/validators/assert-exact-id-set';
import { parseContentState } from '../../common/content-state';

@Injectable()
export class CoursesService {
  constructor(private coursesRepository: CoursesRepository) {}

  async create(data: CreateCourseDto, userId: number) {
    return await this.coursesRepository.create({ ...data, f_userId: userId });
  }

  async findAll(userId: number, role: number, state?: string) {
    const filterUserId = role === UserRoles.SYSADMIN ? undefined : userId;
    return await this.coursesRepository.findAll(
      filterUserId,
      parseContentState(state),
    );
  }

  async reorder(userId: number, ids: number[]) {
    const ownedIds = await this.coursesRepository.findIdsByUser(userId);
    assertExactIdSet(ownedIds, ids);
    await this.coursesRepository.reorder(ids);
    return this.coursesRepository.findAll(userId);
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
    await this.requireOwned(id, userId, role);
    return this.coursesRepository.softDelete(id);
  }

  async archive(id: number, userId: number, role: number) {
    await this.requireOwned(id, userId, role);
    return this.coursesRepository.archive(id);
  }

  async unarchive(id: number, userId: number, role: number) {
    await this.requireOwned(id, userId, role);
    return this.coursesRepository.unarchive(id);
  }

  async restore(id: number, userId: number, role: number) {
    await this.requireOwned(id, userId, role);
    return this.coursesRepository.restore(id);
  }

  async purge(id: number, userId: number, role: number) {
    const row = await this.requireOwned(id, userId, role);
    if (!row.deleted_at) {
      throw new NotFoundException('Course Not Found');
    }
    return this.coursesRepository.delete(id);
  }

  private async requireOwned(id: number, userId: number, role: number) {
    const row = await this.coursesRepository.findById(id);
    if (!row) throw new NotFoundException('Course Not Found');
    if (row.f_userId !== userId && role !== UserRoles.SYSADMIN) {
      throw new ForbiddenException(
        'You do not have permission to modify this resource',
      );
    }
    return row;
  }
}
