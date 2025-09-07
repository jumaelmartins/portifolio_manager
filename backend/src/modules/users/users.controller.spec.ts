import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../../database/prisma.service';
import { HashService } from '../../common/services/hash.service';
import { EmailVerificationService } from '../auth/email_verification_token.service';
import { EmailService } from '../../email/email.service';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from './repository/users.repository';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        PrismaService,
        HashService,
        EmailVerificationService,
        EmailService,
        ConfigService,
        UserRepository
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
