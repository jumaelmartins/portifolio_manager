import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
import { EducationRepository } from './repository/education.repository';
import { UserRoles } from '../../utils/types';
import { assertExactIdSet } from '../../common/validators/assert-exact-id-set';

@Injectable()
export class EducationService {
  constructor(private educationRepository: EducationRepository) {}

  async create(data: CreateEducationDto, userId: number) {
    return await this.educationRepository.create({ ...data, f_userId: userId });
  }

  async findAll(userId: number, role: number) {
    const filterUserId = role === UserRoles.SYSADMIN ? undefined : userId;
    return await this.educationRepository.findAll(filterUserId);
  }

  async reorder(userId: number, ids: number[]) {
    const ownedIds = await this.educationRepository.findIdsByUser(userId);
    assertExactIdSet(ownedIds, ids);
    await this.educationRepository.reorder(ids);
    return this.educationRepository.findAll(userId);
  }

  async findOne(id: number) {
    const education = await this.educationRepository.findById(id);
    if (!education) throw new NotFoundException('Education Not Found');
    return education;
  }

  async update(
    id: number,
    data: UpdateEducationDto,
    userId: number,
    role: number,
  ) {
    const education = await this.educationRepository.findById(id);
    if (!education) throw new NotFoundException('Education Not Found');
    if (education.f_userId !== userId && role !== UserRoles.SYSADMIN) {
      throw new ForbiddenException(
        'You do not have permission to edit this resource',
      );
    }
    return this.educationRepository.update(id, {
      ...data,
      start_date: data.start_date ? new Date(data.start_date) : undefined,
      end_date: data.end_date ? new Date(data.end_date) : undefined,
    });
  }

  async remove(id: number, userId: number, role: number) {
    const education = await this.educationRepository.findById(id);
    if (!education) throw new NotFoundException('Education Not Found');
    if (education.f_userId !== userId && role !== UserRoles.SYSADMIN) {
      throw new ForbiddenException(
        'You do not have permission to delete this resource',
      );
    }
    return await this.educationRepository.delete(id);
  }
}
