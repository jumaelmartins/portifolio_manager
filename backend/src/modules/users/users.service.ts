import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { f_user } from '@prisma/client';
import { HashService } from '../../common/services/hash.service';
import { UserRepository } from './repository/users.repository';
import { CreateUserDto, UserRole } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private userRepository: UserRepository,
    private hashService: HashService,
  ) {}

  async create(data: CreateUserDto): Promise<Omit<f_user, 'password_hash'>> {
    const { email, password_hash } = data;

    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email already exist');
    }
    const hashedPassword = await this.hashService.hashPassword(password_hash);

    const newUser = await this.userRepository.create({
      ...data,
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
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
  async findAll(): Promise<Omit<f_user[], 'password_hash'> | null> {
    const users = await this.userRepository.findAll();

    if (!users) {
      throw new UnauthorizedException('Users not found');
    }
    return users;
  }

  async update(
    id: number,
    data: UpdateUserDto,
  ): Promise<Omit<f_user, 'password_hash'> | null> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new UnauthorizedException('User not found');
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
      throw new ForbiddenException('User not found');
    }
    if (user?.role_id === UserRole.Admin) {
      throw new UnauthorizedException("You can't delete user admin");
    }

    await this.userRepository.delete(id);
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<f_user, 'password_hash'> | null> {
    const user = await this.userRepository.findByEmailWithPassword(email);
    if (!user || user.status_id !== 2) {
      throw new ForbiddenException('user not exist or inactive');
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
      throw new UnauthorizedException('User not found');
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
