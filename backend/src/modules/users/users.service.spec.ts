import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../database/prisma.service';
import { EmailVerificationService } from '../auth/email_verification_token.service';
import { HashService } from '../../common/services/hash.service';
import { EmailService } from '../../email/email.service';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from './repository/users.repository';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;
  let emailVerificationService: jest.Mocked<EmailVerificationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        PrismaService,
        {
          provide: EmailVerificationService,
          useValue: {
            sendVerificationEmail: jest.fn(),
          },
        },
        HashService,
        EmailService,
        ConfigService,
        UserRepository,
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    service = module.get<UsersService>(UsersService);
    emailVerificationService = module.get(EmailVerificationService);

    await prisma.f_user.deleteMany({
      where: { NOT: { id: 1 } },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new user', async () => {
    await prisma.f_user.deleteMany({
      where: { NOT: { id: 1 } },
    });

    const user = await service.create({
      username: 'user1',
      email: 'user1@email.com',
      password_hash: '123456',
    });
    expect(user.status_id).toBe(1);
    expect(user).toHaveProperty('email');
  });
  it('should not create a user if email already in use', async () => {
    await service.create({
      username: 'user1',
      email: 'user1@email.com',
      password_hash: '123456',
    });

    await expect(
      service.create({
        username: 'user1',
        email: 'user1@email.com',
        password_hash: '123456',
      }),
    ).rejects.toThrow(new ConflictException('Email already exist'));
  });

  it('should return a list of users', async () => {
    await service.create({
      username: 'user1',
      email: 'user1@email.com',
      password_hash: '123456',
    });
    await service.create({
      username: 'user2',
      email: 'user2@email.com',
      password_hash: '123456',
    });
    const users = await service.findAll();
    expect(users?.length).toBeGreaterThan(0);
  });

  it('Should return a user by passing an id', async () => {
    const newUser = await service.create({
      username: 'user1',
      email: 'user1@email.com',
      password_hash: '123456',
    });

    expect(await service.findOne(newUser.id)).toHaveProperty('email');
    expect(await service.findOne(newUser.id)).toHaveProperty('username');
  });

  it('Should throw an exception if a user didnt exist', async () => {
    await expect(service.findOne(165789)).rejects.toThrow(
      new UnauthorizedException('User not found'),
    );
  });

  it('Should update an user', async () => {
    const user = await service.create({
      username: 'testeUser1',
      password_hash: '123456',
      email: 'testeUser1@email.com',
    });
    const updatedUser = await service.update(user.id, {
      username: 'updatedUser',
    });

    expect(updatedUser?.username).toEqual(updatedUser?.username);
  });

  it('Should throw an expetion if user didnt exist', async () => {
    await expect(
      service.update(1000000, {
        username: 'updatedUser',
      }),
    ).rejects.toThrow(new UnauthorizedException('User not found'));
  });
});
