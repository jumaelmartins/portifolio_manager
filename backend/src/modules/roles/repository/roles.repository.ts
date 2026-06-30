import { Injectable } from '@nestjs/common';
import { d_roles } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CreateRoleDto } from '../dto/create-role.dto';

@Injectable()
export class RolesRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<d_roles[]> {
    return await this.prisma.d_roles.findMany();
  }

  async findById(id: number): Promise<d_roles | null> {
    return await this.prisma.d_roles.findUnique({ where: { id } });
  }

  async findByRole(roleName: string): Promise<d_roles | null> {
    return await this.prisma.d_roles.findFirst({
      where: { role: roleName.toLowerCase() },
    });
  }

  async create(roleData: CreateRoleDto): Promise<d_roles> {
    return await this.prisma.d_roles.create({ data: roleData });
  }

  async update(id: number, roleData: Partial<d_roles>): Promise<d_roles> {
    return await this.prisma.d_roles.update({
      where: { id },
      data: roleData,
    });
  }

  async delete(id: number) {
    return await this.prisma.d_roles.delete({ where: { id } });
  }
}
