import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { HashService } from 'src/common/services/hash.service';
import { EmailVerificationService } from '../auth/email_verification_token.service';
import { EmailService } from 'src/email/email.service';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from './repository/users.repository';

@Module({
  controllers: [UsersController],
  providers: [
    UserRepository,
    UsersService,
    HashService,
    EmailVerificationService,
    EmailService,
    ConfigService,
  ],
})
export class UsersModule {}
