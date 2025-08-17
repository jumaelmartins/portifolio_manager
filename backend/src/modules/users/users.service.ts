import { ConflictException, Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/database/prisma.service';
import { Prisma, f_user } from '@prisma/client';
import { HashService } from 'src/common/services/hash.service';
import { EmailVerificationService } from '../auth/email_verification_token.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private hashService: HashService,
    private emailVerificationService: EmailVerificationService,
  ) {}

  async create(
    data: Prisma.f_userCreateInput,
  ): Promise<Omit<f_user, 'password_hash'>> {
    const { email, password_hash } = data;

    const existingUser = await this.prisma.f_user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exist');
    }
    const hashedPassword = await this.hashService.hashPassword(password_hash);

    const newUser = await this.prisma.f_user.create({
      data: {
        ...data,
        username:
          data.username?.toLowerCase() ||
          data.email.split('@')[0].toLocaleLowerCase(),
        email: data.email.toLowerCase(),
        password_hash: hashedPassword,
      },
    });
    const { password_hash: _, ...userWithoutSensitiveData } = newUser;

    await this.emailVerificationService.sendVerificationEmail(newUser.id);
    return userWithoutSensitiveData;
  }
  async findByEmailWithPassword(email: string): Promise<f_user | null> {
    return await this.prisma.f_user.findUnique({
      where: { email },
    });
  }

  async findOne(id: number): Promise<Omit<f_user, 'password_hash'> | null> {
    const user = await this.prisma.f_user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    const { password_hash: _, ...userWithoutSensitiveData } = user;
    return userWithoutSensitiveData;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<f_user | null> {
    return await this.prisma.f_user.update({
      where: { id },
      data: {
        email: updateUserDto.email?.toLocaleLowerCase(),
        username: updateUserDto.username?.toLocaleLowerCase(),
      },
    });
  }

  async inactivate(id: number): Promise<f_user> {
    return await this.prisma.f_user.update({
      where: { id },
      data: {
        status_id: 1,
      },
    });
  }

  async findAll(): Promise<Omit<f_user, 'password_hash'>[] | null> {
    const users = await this.prisma.f_user.findMany();
    const usersWithoutSensitiveData = users.map((u) => {
      const { password_hash: _, ...userWithoutSensitiveData } = u;
      return userWithoutSensitiveData;
    });

    return usersWithoutSensitiveData;
  }

  /**
   * Valida as credenciais do usuário
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<f_user, 'password_hash'> | null> {
    const user = await this.findByEmailWithPassword(email);
    if (!user || user.status_id !== 2) {
      return null;
    }
    const isPasswordValid = await this.hashService.comparePassword(
      password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      return null;
    }

    // Atualiza último login
    await this.prisma.f_user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    const { password_hash: _, ...userWithoutSensitiveData } = user;
    return userWithoutSensitiveData;
  }

  async updatePassword(id: number, newPassword: string): Promise<boolean> {
    const hashedPassword = await this.hashService.hashPassword(newPassword);

    const result = await this.prisma.f_user.update({
      where: { id },
      data: { password_hash: hashedPassword },
    });

    return !!result;
  }
}
