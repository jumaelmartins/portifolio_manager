import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { HashService } from '../../common/services/hash.service';
import { EmailVerificationService } from './email_verification_token.service';
import { PasswordResetService } from './password_reset.service';
import { EmailService } from 'src/email/email.service';
import { AuthController } from './auth.controller';
import { UsersService } from '../users/users.service';
import { UserRepository } from '../users/repository/users.repository';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>(
          'JWT_SECRET',
          'your-super-secret-key',
        ),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '24h'),
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    GoogleStrategy,
    HashService,
    EmailVerificationService,
    PasswordResetService,
    EmailService,
    ConfigService,
    UsersService,
    UserRepository,
  ],
  exports: [JwtModule],
})
export class AuthModule {}
