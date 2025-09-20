import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTechnologyDto } from './dto/create-technology.dto';
import { UpdateTechnologyDto } from './dto/update-technology.dto';
import { TechnologiesRepository } from './repository/technologies.repository';

@Injectable()
export class TechnologiesService {
  constructor(private technologiesRepository: TechnologiesRepository) {}

  async create(data: CreateTechnologyDto) {
    const tech = await this.technologiesRepository.findByTech(
      data.tech.toLowerCase(),
    );
    if (tech) {
      throw new ConflictException('Technology Already Exists');
    }

    const newTech = { ...data, tech: data.tech.toLowerCase() };

    return this.technologiesRepository.create(newTech);
  }

  async findAll() {
    return this.technologiesRepository.findAll();
  }

  async findOne(id: number) {
    const tech = await this.technologiesRepository.findById(id);
    if (!tech) {
      throw new NotFoundException('Technology Not Found');
    }

    return this.technologiesRepository.findById(id);
  }

  async update(id: number, data: UpdateTechnologyDto) {
    const tech = await this.technologiesRepository.findById(id);
    if (!tech) {
      throw new NotFoundException('Technology Not Found');
    }

    const newData = {
      ...data,
      tech: data.tech?.toLowerCase(),
    };

    return this.technologiesRepository.update(id, newData);
  }

  async remove(id: number) {
    const tech = await this.technologiesRepository.findById(id);
    if (!tech) {
      throw new NotFoundException('Technology Not Found');
    }

    return this.technologiesRepository.delete(id);
  }
}
