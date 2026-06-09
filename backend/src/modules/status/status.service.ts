import { ConflictException, Injectable } from '@nestjs/common';
import { UpdateStatusDto } from './dto/update-status.dto';
import { StatusRepository } from './repository/status.repository';
import { CreateStatusDto } from './dto/create-status.dto';

@Injectable()
export class StatusService {
  constructor(private status: StatusRepository) {}
  async create(data: CreateStatusDto) {
    const existingStatus = await this.status.findByStatus(data.status);
    if (existingStatus) {
      throw new ConflictException('Status already exists');
    }
    return await this.status.create({
      status: data.status.toLowerCase(),
    });
  }

  async findAll() {
    return await this.status.findAll();
  }

  async findOne(id: number) {
    return await this.status.findById(id);
  }

  async update(id: number, updateStatusDto: UpdateStatusDto) {
    const existingStatus = await this.status.findById(id);
    if (!existingStatus) {
      throw new ConflictException('Status not found');
    }
    return await this.status.update(id, updateStatusDto);
  }

  async remove(id: number) {
    const existingStatus = await this.status.findById(id);
    if (!existingStatus) {
      throw new ConflictException('Status not found');
    }
    return await this.status.delete(id);
  }
}
