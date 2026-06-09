import { Injectable } from '@nestjs/common';
import { CreateStatusDto } from '../dto/create-status.dto';
import { UpdateStatusDto } from '../dto/update-status.dto';
import { d_status } from '@prisma/client';

@Injectable()
export class StatusInMemoryRepository {
  private status: d_status[] = [];
  private currentId = 1;

  async findAll() {
    return this.status;
  }
  async create(data: CreateStatusDto) {
    const statusData = {
      id: this.currentId,
      status: data.status.toLowerCase(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.status.push(statusData);
    this.currentId++;
    return statusData;
  }
  async findById(id: number) {
    const status = this.status.find((item) => item.id === +id);
    return status;
  }
  async findByStatus(status: string) {
    const statusRecord = this.status.find(
      (item) => item.status.toLowerCase() === status.toLowerCase(),
    );
    return statusRecord;
  }
  async update(id: number, data: UpdateStatusDto) {
    const index = this.status.findIndex((item) => item.id === +id);
    if (index === -1) {
      return;
    }
    this.status[index] = { ...this.status[index], ...data };
    return this.status[index];
  }

  async delete(id: number) {
    const index = this.status.findIndex((item) => item.id === id);
    if (index === -1) {
      return;
    }
    this.status.splice(index, 1)[0];
    return;
  }
  reset() {
    this.status = [];
  }
}
