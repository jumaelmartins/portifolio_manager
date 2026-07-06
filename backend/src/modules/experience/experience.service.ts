import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { ExperienceRepository } from './repository/experience.repository';
import { UserRoles } from '../../utils/types';
import { assertExactIdSet } from '../../common/validators/assert-exact-id-set';

@Injectable()
export class ExperienceService {
  constructor(private experienceRepository: ExperienceRepository) {}

  async create(data: CreateExperienceDto, userId: number) {
    return await this.experienceRepository.create({
      ...data,
      f_userId: userId,
    });
  }

  async findAll(userId: number, role: number) {
    const filterUserId = role === UserRoles.SYSADMIN ? undefined : userId;
    return await this.experienceRepository.findAll(filterUserId);
  }

  async reorder(userId: number, ids: number[]) {
    const ownedIds = await this.experienceRepository.findIdsByUser(userId);
    assertExactIdSet(ownedIds, ids);
    await this.experienceRepository.reorder(ids);
    return this.experienceRepository.findAll(userId);
  }

  async findOne(id: number) {
    const experience = await this.experienceRepository.findById(id);
    if (!experience) throw new NotFoundException('Experience Not Found');
    return experience;
  }

  async update(
    id: number,
    data: UpdateExperienceDto,
    userId: number,
    role: number,
  ) {
    const experience = await this.experienceRepository.findById(id);
    if (!experience) throw new NotFoundException('Experience Not Found');
    if (experience.f_userId !== userId && role !== UserRoles.SYSADMIN) {
      throw new ForbiddenException(
        'You do not have permission to edit this resource',
      );
    }
    return this.experienceRepository.update(id, {
      ...data,
      start_date: data.start_date ? new Date(data.start_date) : undefined,
      end_date: data.end_date ? new Date(data.end_date) : undefined,
    });
  }

  async remove(id: number, userId: number, role: number) {
    const experience = await this.experienceRepository.findById(id);
    if (!experience) throw new NotFoundException('Experience Not Found');
    if (experience.f_userId !== userId && role !== UserRoles.SYSADMIN) {
      throw new ForbiddenException(
        'You do not have permission to delete this resource',
      );
    }
    return await this.experienceRepository.delete(id);
  }
}
