import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { f_user } from '@prisma/client';
import { HashService } from '../../common/services/hash.service';
import { UserRepository } from './repository/users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password-user.dto';
import { UserStatus } from '../../utils/types';

@Injectable()
export class UsersService {
  constructor(
    private userRepository: UserRepository,
    private hashService: HashService,
  ) {}

  async create(data: CreateUserDto): Promise<Omit<f_user, 'password_hash'>> {
    const { email, password } = data;

    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email already exist');
    }
    const hashedPassword = await this.hashService.hashPassword(password);

    const newUser = await this.userRepository.create({
      username:
        data.username?.toLowerCase() ||
        data.email.split('@')[0].toLocaleLowerCase(),
      email: data.email.toLowerCase(),
      password_hash: hashedPassword,
    });
    return newUser;
  }

  async findOne(id: number): Promise<Omit<f_user, 'password_hash'> | null> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
  async findAll(): Promise<Array<Omit<f_user, 'password_hash'>> | null> {
    const users = await this.userRepository.findAll();
    return users;
  }

  async update(
    id: number,
    data: UpdateUserDto,
  ): Promise<Omit<f_user, 'password_hash'> | null> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return await this.userRepository.update(id, {
      ...data,
      email: data.email && data.email.toLowerCase(),
      username: data.username && data.username.toLowerCase(),
    });
  }

  async delete(id: number): Promise<void> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.delete(id);
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<f_user, 'password_hash'> | null> {
    const user = await this.userRepository.findByEmailWithPassword(email);
    if (!user || user.status_id !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('user not exist or inactive');
    }
    const isPasswordValid = await this.hashService.comparePassword(
      password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new ForbiddenException('invalid password');
    }

    await this.userRepository.update(user.id, { last_login: new Date() });
    const { password_hash: _, ...userWithoutSensitiveData } = user;
    return userWithoutSensitiveData;
  }

  async updatePassword(
    email: string,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<void> {
    const user = await this.userRepository.findByEmailWithPassword(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await this.hashService.comparePassword(
      updatePasswordDto.current_password,
      user.password_hash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('invalid password');
    }

    const hashedPassword = await this.hashService.hashPassword(
      updatePasswordDto.new_password,
    );

    await this.userRepository.update(user.id, {
      password_hash: hashedPassword,
    });
  }
}
