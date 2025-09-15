import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
import { EducationRepository } from './repository/education.repository';

@Injectable()
export class EducationService {
  constructor(private educationRepository: EducationRepository) {}

  async create(data: CreateEducationDto) {
    return await this.educationRepository.create(data);
  }

  async findAll() {
    return await this.educationRepository.findAll();
  }

  async findOne(id: number) {
    const education = await this.educationRepository.findById(id);
    if (!education) {
      throw new NotFoundException('Education Not Found');
    }
    return education;
  }

  async update(id: number, data: UpdateEducationDto) {
    const education = await this.educationRepository.findById(id);
    if (!education) {
      throw new NotFoundException('Education Not Found');
    }
    return this.educationRepository.update(id, data);
  }

  async remove(id: number) {
    const education = await this.educationRepository.findById(id);
    if (!education) {
      throw new NotFoundException('Education Not Found');
    }
    return await this.educationRepository.delete(id);
  }
}
