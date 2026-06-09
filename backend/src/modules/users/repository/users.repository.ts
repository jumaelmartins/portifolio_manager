import { Prisma, f_user } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { Injectable } from '@nestjs/common';

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
      omit: {
        password_hash: true,
      },
      include: {
        role: true,
        status: true,
        images: true,
        f_projects: true,
        f_courses: true,
        f_profile_picture: true,
        f_education: true,
        f_experience: true,
      },
    });

    return user;
  }
  async findAll(): Promise<Omit<f_user, 'password_hash'>[] | null> {
    return await this.prisma.f_user.findMany({
      omit: { password_hash: true },
      include: {
        role: true,
        status: true,
        images: true,
        f_projects: true,
        f_courses: true,
        f_profile_picture: true,
        f_education: true,
        f_experience: true,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.f_user.delete({ where: { id } });
  }
}
