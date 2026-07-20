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
import { parseContentState } from '../../common/content-state';

@Injectable()
export class ExperienceService {
  constructor(private experienceRepository: ExperienceRepository) {}

  async create(data: CreateExperienceDto, userId: number) {
    return await this.experienceRepository.create({
      ...data,
      f_userId: userId,
    });
  }

  async findAll(userId: number, role: number, state?: string) {
    const filterUserId = role === UserRoles.SYSADMIN ? undefined : userId;
    return await this.experienceRepository.findAll(
      filterUserId,
      parseContentState(state),
    );
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
    await this.requireOwned(id, userId, role);
    return this.experienceRepository.softDelete(id);
  }

  async archive(id: number, userId: number, role: number) {
    await this.requireOwned(id, userId, role);
    return this.experienceRepository.archive(id);
  }

  async unarchive(id: number, userId: number, role: number) {
    await this.requireOwned(id, userId, role);
    return this.experienceRepository.unarchive(id);
  }

  async restore(id: number, userId: number, role: number) {
    await this.requireOwned(id, userId, role);
    return this.experienceRepository.restore(id);
  }

  async purge(id: number, userId: number, role: number) {
    const row = await this.requireOwned(id, userId, role);
    if (!row.deleted_at) {
      throw new NotFoundException('Experience Not Found');
    }
    return this.experienceRepository.delete(id);
  }

  private async requireOwned(id: number, userId: number, role: number) {
    const row = await this.experienceRepository.findById(id);
    if (!row) throw new NotFoundException('Experience Not Found');
    if (row.f_userId !== userId && role !== UserRoles.SYSADMIN) {
      throw new ForbiddenException(
        'You do not have permission to modify this resource',
      );
    }
    return row;
  }
}
