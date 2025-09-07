import { Prisma, f_user } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async create(
    data: Prisma.f_userCreateInput,
  ): Promise<Omit<f_user, 'password_hash'>> {
    const newUser = await this.prisma.f_user.create({ data });

    return newUser;
  }

  async update(
    id: number,
    data: Prisma.f_userUpdateInput,
  ): Promise<Omit<f_user, 'password_hash'>> {
    const updatedUser = await this.prisma.f_user.update({
      where: { id },
      data: data,
    });

    return updatedUser;
  }

  async findByEmail(
    email: string,
  ): Promise<Omit<f_user, 'password_hash'> | null> {
    const user = await this.prisma.f_user.findUnique({
      where: { email: email.toLowerCase() },
    });

    return user;
  }
  async findByEmailWithPassword(email: string): Promise<f_user | null> {
    const user = await this.prisma.f_user.findUnique({
      where: { email: email.toLowerCase() },
    });

    return user;
  }

  async findById(id: number): Promise<Omit<f_user, 'password_hash'> | null> {
    const user = await this.prisma.f_user.findUnique({
      where: { id },
    });

    return user;
  }
  async findAll(): Promise<Omit<f_user[], 'password_hash'> | null> {
    return await this.prisma.f_user.findMany();
  }

  async delete(id: number): Promise<void> {
    await this.prisma.f_user.delete({ where: { id } });
  }
}
