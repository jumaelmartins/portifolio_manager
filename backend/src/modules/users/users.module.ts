import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from 'src/database/prisma.service';
import { HashService } from 'src/common/services/hash.service';
import { EmailVerificationService } from '../auth/email_verification_token.service';
import { EmailService } from 'src/email/email.service';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService, HashService, EmailVerificationService, EmailService, ConfigService],
})
export class UsersModule {}
