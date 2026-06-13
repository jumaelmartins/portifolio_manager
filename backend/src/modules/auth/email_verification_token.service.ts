import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomBytes, randomInt } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../email/email.service';

export type VerificationChallenge = {
  token: string;
  expiresInSeconds: number;
};

export type GeneratedVerificationChallenge = VerificationChallenge & {
  code: string;
};

type IssuedVerificationChallenge = GeneratedVerificationChallenge & {
  email: string;
};

type VerificationResult =
  | { kind: 'verified'; email: string }
  | { kind: 'error'; message: string }
  | { kind: 'conflict' };

export const MAX_VERIFICATION_ATTEMPTS = 5;
export const MAX_VERIFICATION_CHALLENGES_PER_HOUR = 5;
const VERIFICATION_COOLDOWN_SECONDS = 2 * 60;
const VERIFICATION_QUOTA_WINDOW_SECONDS = 60 * 60;

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
    const challenge = await this.issueVerificationChallenge(user_id, false);
    return {
      token: challenge.token,
      code: challenge.code,
      expiresInSeconds: challenge.expiresInSeconds,
    };
  }

  async sendVerificationEmail(user_id: number): Promise<VerificationChallenge> {
    const challenge = await this.issueVerificationChallenge(user_id, false);
    return this.deliverVerificationChallenge(challenge);
  }

  async verifyEmailWithCode(token: string, code: string): Promise<boolean> {
    const result = await this.prisma.$transaction(async (transaction) => {
      const verificationToken =
        await transaction.f_email_verification_token.findUnique({
          where: { token },
          include: { f_user: true },
        });

      if (!verificationToken) {
        return {
          kind: 'error',
          message: 'invalid verification token',
        } satisfies VerificationResult;
      }

      const stateError = this.getVerificationStateError(verificationToken);
      if (stateError) {
        return {
          kind: 'error',
          message: stateError,
        } satisfies VerificationResult;
      }

      if (verificationToken.code !== code) {
        const failedAttempt =
          await transaction.f_email_verification_token.updateMany({
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
          return { kind: 'conflict' } satisfies VerificationResult;
        }

        return {
          kind: 'error',
          message: 'invalid code',
        } satisfies VerificationResult;
      }

      const consumed = await transaction.f_email_verification_token.updateMany({
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
        return { kind: 'conflict' } satisfies VerificationResult;
      }

      await transaction.f_user.update({
        where: { id: verificationToken.user_id },
        data: {
          verified_email: true,
          status_id: 2,
          email_verified_at: new Date(),
        },
      });

      return {
        kind: 'verified',
        email: verificationToken.f_user.email,
      } satisfies VerificationResult;
    });

    switch (result.kind) {
      case 'conflict':
        return this.throwCurrentVerificationState(token);
      case 'error':
        throw new BadRequestException(result.message);
      case 'verified':
        break;
    }

    const userName = result.email.split('@')[0];
    await this.emailService.sendWelcomeEmail(result.email, userName);

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

    const challenge = await this.issueVerificationChallenge(user.id, true);
    return this.deliverVerificationChallenge(challenge);
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

  private async issueVerificationChallenge(
    userId: number,
    enforceLimits: boolean,
  ): Promise<IssuedVerificationChallenge> {
    return this.prisma.$transaction(async (transaction) => {
      await this.lockVerificationUser(transaction, userId);

      const user = await transaction.f_user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('user not found');
      }
      if (user.verified_email) {
        throw new BadRequestException('email already verified');
      }

      const now = new Date();
      if (enforceLimits) {
        await this.enforceChallengeLimits(transaction, userId, now);
      }

      const expirationMinutes = this.configService.get<number>(
        'EMAIL_VERIFICATION_EXPIRATION',
        30,
      );
      const expiresAt = new Date(now.getTime() + expirationMinutes * 60 * 1000);
      const token = randomBytes(32).toString('hex');
      const code = randomInt(100000, 999999).toString();

      await transaction.f_email_verification_token.updateMany({
        where: {
          user_id: userId,
          is_used: false,
        },
        data: {
          is_used: true,
          used_at: now,
        },
      });

      await transaction.f_email_verification_token.create({
        data: {
          token,
          code,
          user_id: userId,
          expires_at: expiresAt,
        },
      });

      return {
        token,
        code,
        email: user.email,
        expiresInSeconds: expirationMinutes * 60,
      };
    });
  }

  private async enforceChallengeLimits(
    transaction: Prisma.TransactionClient,
    userId: number,
    now: Date,
  ): Promise<void> {
    const quotaWindowStart = new Date(
      now.getTime() - VERIFICATION_QUOTA_WINDOW_SECONDS * 1000,
    );
    const challengesLastHour =
      await transaction.f_email_verification_token.count({
        where: {
          user_id: userId,
          created_at: { gt: quotaWindowStart },
        },
      });

    if (challengesLastHour >= MAX_VERIFICATION_CHALLENGES_PER_HOUR) {
      const oldestChallenge =
        await transaction.f_email_verification_token.findFirst({
          where: {
            user_id: userId,
            created_at: { gt: quotaWindowStart },
          },
          orderBy: { created_at: 'asc' },
          select: { created_at: true },
        });
      const retryAfterSeconds = oldestChallenge
        ? this.secondsUntil(
            new Date(
              oldestChallenge.created_at.getTime() +
                VERIFICATION_QUOTA_WINDOW_SECONDS * 1000,
            ),
            now,
          )
        : VERIFICATION_QUOTA_WINDOW_SECONDS;

      throw this.createRateLimitException(
        'verification request limit exceeded',
        retryAfterSeconds,
      );
    }

    const cooldownStart = new Date(
      now.getTime() - VERIFICATION_COOLDOWN_SECONDS * 1000,
    );
    const recentToken = await transaction.f_email_verification_token.findFirst({
      where: {
        user_id: userId,
        created_at: { gt: cooldownStart },
      },
      orderBy: { created_at: 'desc' },
      select: { created_at: true },
    });

    if (recentToken) {
      const retryAfterSeconds = this.secondsUntil(
        new Date(
          recentToken.created_at.getTime() +
            VERIFICATION_COOLDOWN_SECONDS * 1000,
        ),
        now,
      );
      throw this.createRateLimitException(
        'wait for 2 minutes before send new request email',
        retryAfterSeconds,
      );
    }
  }

  private async deliverVerificationChallenge(
    challenge: IssuedVerificationChallenge,
  ): Promise<VerificationChallenge> {
    const emailSent = await this.emailService.sendVerificationEmail(
      challenge.email,
      challenge.email.split('@')[0],
      challenge.code,
      challenge.token,
      challenge.expiresInSeconds,
    );

    if (!emailSent) {
      throw new BadRequestException('error to send verification email');
    }

    return {
      token: challenge.token,
      expiresInSeconds: challenge.expiresInSeconds,
    };
  }

  private async lockVerificationUser(
    transaction: Prisma.TransactionClient,
    userId: number,
  ): Promise<void> {
    await transaction.$queryRaw`
      SELECT pg_advisory_xact_lock(CAST(${userId} AS bigint))
    `;
  }

  private getVerificationStateError(verificationToken: {
    is_used: boolean;
    expires_at: Date;
    failed_attempts: number;
  }): string | undefined {
    if (verificationToken.is_used) {
      return 'token already in use';
    }
    if (verificationToken.expires_at < new Date()) {
      return 'expired token';
    }
    if (verificationToken.failed_attempts >= MAX_VERIFICATION_ATTEMPTS) {
      return 'too many verification attempts';
    }
    return undefined;
  }

  private async throwCurrentVerificationState(token: string): Promise<never> {
    const current = await this.prisma.f_email_verification_token.findUnique({
      where: { token },
    });

    if (!current) {
      throw new BadRequestException('invalid verification token');
    }

    const stateError = this.getVerificationStateError(current);
    throw new BadRequestException(stateError ?? 'invalid verification token');
  }

  private createRateLimitException(
    message: string,
    retryAfterSeconds: number,
  ): HttpException {
    return new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message,
        retryAfterSeconds: Math.max(1, retryAfterSeconds),
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private secondsUntil(target: Date, now: Date): number {
    return Math.max(1, Math.ceil((target.getTime() - now.getTime()) / 1000));
  }
}
