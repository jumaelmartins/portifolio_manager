import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateStatusDto } from '../dto/create-status.dto';
import { UpdateStatusDto } from '../dto/update-status.dto';

@Injectable()
export class StatusRepository {
  constructor(private prisma: PrismaService) {}
  // Repository methods here
  async findAll() {
    return await this.prisma.d_status.findMany();
  }
  async create(data: CreateStatusDto) {
    const statusData = { status: data.status.toLowerCase() };
    return await this.prisma.d_status.create({
      data: statusData,
    });
  }
  async findById(id: number) {
    return await this.prisma.d_status.findUnique({
      where: { id },
    });
  }
  async findByStatus(status: string) {
    return await this.prisma.d_status.findUnique({
      where: { status: status.toLowerCase() },
    });
  }
  async update(id: number, data: UpdateStatusDto) {
    const statusData = { status: data.status.toLowerCase() };
    return await this.prisma.d_status.update({
      where: { id },
      data: statusData,
    });
  }
  async delete(id: number) {
    return await this.prisma.d_status.delete({
      where: { id },
    });
  }
}
