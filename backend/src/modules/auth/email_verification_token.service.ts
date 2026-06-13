import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../email/email.service';
import { ConfigService } from '@nestjs/config';
import { randomBytes, randomInt } from 'crypto';

export type VerificationChallenge = {
  token: string;
  expiresInSeconds: number;
};

export type GeneratedVerificationChallenge = VerificationChallenge & {
  code: string;
};

export const MAX_VERIFICATION_ATTEMPTS = 5;
export const MAX_VERIFICATION_CHALLENGES_PER_HOUR = 5;

@Injectable()
export class EmailVerificationService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async generateVerificationToken(
    user_id: number,
  ): Promise<GeneratedVerificationChallenge> {
    const token = randomBytes(32).toString('hex');
    const code = randomInt(100000, 999999).toString();
    const expirationMinutes = this.configService.get<number>(
      'EMAIL_VERIFICATION_EXPIRATION',
      30,
    );
    const expires_at = new Date(Date.now() + expirationMinutes * 60 * 1000);

    await this.prisma.f_email_verification_token.updateMany({
      where: {
        user_id,
        is_used: false,
        expires_at: { gt: new Date() },
      },
      data: { is_used: true },
    });

    await this.prisma.f_email_verification_token.create({
      data: {
        token,
        code,
        user_id,
        expires_at,
      },
    });

    return {
      token,
      code,
      expiresInSeconds: expirationMinutes * 60,
    };
  }

  async sendVerificationEmail(user_id: number): Promise<VerificationChallenge> {
    const user = await this.prisma.f_user.findUnique({
      where: { id: user_id },
    });

    if (!user) {
      throw new NotFoundException('user not found');
    }
    if (user.verified_email) {
      throw new BadRequestException('email already verified');
    }

    const { token, code, expiresInSeconds } =
      await this.generateVerificationToken(user_id);

    const userName = user.email.split('@')[0];

    const emailSent = await this.emailService.sendVerificationEmail(
      user.email,
      userName,
      code,
      token,
      expiresInSeconds,
    );

    if (!emailSent) {
      throw new BadRequestException('error to send verification email');
    }

    return { token, expiresInSeconds };
  }

  async verifyEmailWithCode(token: string, code: string): Promise<boolean> {
    const verificationToken =
      await this.prisma.f_email_verification_token.findUnique({
        where: { token },
        include: { f_user: true },
      });

    if (!verificationToken) {
      throw new BadRequestException('invalid verification token');
    }

    if (verificationToken.is_used) {
      throw new BadRequestException('token already in use');
    }

    if (verificationToken.expires_at < new Date()) {
      throw new BadRequestException('expired token');
    }

    if (verificationToken.failed_attempts >= MAX_VERIFICATION_ATTEMPTS) {
      throw new BadRequestException('too many verification attempts');
    }

    if (verificationToken.code !== code) {
      const failedAttempt =
        await this.prisma.f_email_verification_token.updateMany({
          where: {
            id: verificationToken.id,
            is_used: false,
            failed_attempts: { lt: MAX_VERIFICATION_ATTEMPTS },
          },
          data: {
            failed_attempts: { increment: 1 },
          },
        });

      if (failedAttempt.count === 0) {
        throw new BadRequestException('too many verification attempts');
      }
      throw new BadRequestException('invalid code');
    }

    const consumed = await this.prisma.f_email_verification_token.updateMany({
      where: {
        id: verificationToken.id,
        is_used: false,
        expires_at: { gt: new Date() },
        failed_attempts: { lt: MAX_VERIFICATION_ATTEMPTS },
      },
      data: {
        is_used: true,
        used_at: new Date(),
      },
    });

    if (consumed.count !== 1) {
      throw new BadRequestException('too many verification attempts');
    }

    await this.prisma.f_user.update({
      where: { id: verificationToken.user_id },
      data: {
        verified_email: true,
        status_id: 2,
        email_verified_at: new Date(),
      },
    });

    const userName = verificationToken.f_user.email.split('@')[0];
    await this.emailService.sendWelcomeEmail(
      verificationToken.f_user.email,
      userName,
    );

    return true;
  }

  async verifyEmailWithToken(token: string): Promise<boolean> {
    const verificationToken =
      await this.prisma.f_email_verification_token.findUnique({
        where: { token },
        include: { f_user: true },
      });

    if (!verificationToken) {
      throw new BadRequestException('invalid token');
    }

    if (verificationToken.is_used) {
      throw new BadRequestException('token aldeady in use');
    }

    if (verificationToken.expires_at < new Date()) {
      throw new BadRequestException('expired token');
    }
    return false;
  }

  async resendVerificationEmail(email: string): Promise<VerificationChallenge> {
    const user = await this.prisma.f_user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    if (user.verified_email) {
      throw new BadRequestException('email already verified');
    }

    const challengesLastHour =
      await this.prisma.f_email_verification_token.count({
        where: {
          user_id: user.id,
          created_at: { gt: new Date(Date.now() - 60 * 60 * 1000) },
        },
      });

    if (challengesLastHour >= MAX_VERIFICATION_CHALLENGES_PER_HOUR) {
      throw new BadRequestException('verification request limit exceeded');
    }

    const recentToken = await this.prisma.f_email_verification_token.findFirst({
      where: {
        user_id: user.id,
        created_at: { gt: new Date(Date.now() - 2 * 60 * 1000) }, // 2 minutos
      },
    });

    if (recentToken) {
      throw new BadRequestException(
        'wait for 2 minutes before send new request email',
      );
    }

    return this.sendVerificationEmail(user.id);
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.f_email_verification_token.deleteMany({
      where: {
        expires_at: { lt: new Date() },
      },
    });

    return result.count;
  }

  async getVerificationStatus(user_id: number) {
    const user = await this.prisma.f_user.findUnique({
      where: { id: user_id },
      include: {
        f_email_verification_token: {
          where: { is_used: false, expires_at: { gt: new Date() } },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    return {
      isVerified: user.verified_email,
      verifiedAt: user.email_verified_at,
      hasPendingToken: user.f_email_verification_token.length > 0,
      tokenExpiresAt: user.f_email_verification_token[0]?.expires_at,
    };
  }
}
