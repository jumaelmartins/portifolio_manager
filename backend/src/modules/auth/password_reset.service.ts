import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { HashService } from '../../common/services/hash.service';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../email/email.service';

const RESET_TOKEN_EXPIRATION_MINUTES = 30;
const RESET_MAX_REQUESTS_PER_HOUR = 3;
const RESET_COOLDOWN_SECONDS = 2 * 60;
const RESET_QUOTA_WINDOW_SECONDS = 60 * 60;

@Injectable()
export class PasswordResetService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService,
    private hashService: HashService,
  ) {}

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.f_user.findUnique({ where: { email } });

    if (!user) {
      return;
    }

    if (user.auth_method_id !== 1) {
      throw new BadRequestException(
        "Esta conta usa login via Google. Acesse pelo botão 'Entrar com Google'.",
      );
    }

    const { token, expiresInSeconds } = await this.issueResetToken(user.id);

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3001',
    );
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    const userName = user.username ?? email.split('@')[0];

    const sent = await this.emailService.sendPasswordResetEmail(
      email,
      userName,
      resetUrl,
      expiresInSeconds,
    );

    if (!sent) {
      // Remove the orphaned token so the user can retry without hitting the cooldown
      await this.prisma.f_password_reset_token.delete({ where: { token } }).catch(() => null);
      throw new BadRequestException('error sending password reset email');
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const record = await this.prisma.f_password_reset_token.findUnique({
      where: { token },
    });

    if (!record) {
      throw new BadRequestException('Link inválido ou expirado.');
    }
    if (record.is_used) {
      throw new BadRequestException('Este link já foi utilizado.');
    }
    if (record.expires_at < new Date()) {
      throw new BadRequestException('Link expirado. Solicite um novo.');
    }

    const passwordHash = await this.hashService.hashPassword(password);

    await this.prisma.$transaction(async (tx) => {
      await tx.f_password_reset_token.update({
        where: { token },
        data: { is_used: true, used_at: new Date() },
      });
      await tx.f_user.update({
        where: { id: record.user_id },
        data: { password_hash: passwordHash },
      });
    });
  }

  private async issueResetToken(
    userId: number,
  ): Promise<{ token: string; expiresInSeconds: number }> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(CAST(${userId} AS bigint))`;

      const now = new Date();
      await this.enforceRateLimits(tx, userId, now);

      const expiresAt = new Date(
        now.getTime() + RESET_TOKEN_EXPIRATION_MINUTES * 60 * 1000,
      );
      const token = randomBytes(32).toString('hex');

      await tx.f_password_reset_token.updateMany({
        where: { user_id: userId, is_used: false },
        data: { is_used: true, used_at: now },
      });

      await tx.f_password_reset_token.create({
        data: { token, user_id: userId, expires_at: expiresAt },
      });

      return { token, expiresInSeconds: RESET_TOKEN_EXPIRATION_MINUTES * 60 };
    });
  }

  private async enforceRateLimits(
    tx: Prisma.TransactionClient,
    userId: number,
    now: Date,
  ): Promise<void> {
    const quotaWindowStart = new Date(
      now.getTime() - RESET_QUOTA_WINDOW_SECONDS * 1000,
    );

    const requestsLastHour = await tx.f_password_reset_token.count({
      where: { user_id: userId, created_at: { gt: quotaWindowStart } },
    });

    if (requestsLastHour >= RESET_MAX_REQUESTS_PER_HOUR) {
      const oldest = await tx.f_password_reset_token.findFirst({
        where: { user_id: userId, created_at: { gt: quotaWindowStart } },
        orderBy: { created_at: 'asc' },
        select: { created_at: true },
      });
      const retryAfterSeconds = oldest
        ? this.secondsUntil(
            new Date(
              oldest.created_at.getTime() + RESET_QUOTA_WINDOW_SECONDS * 1000,
            ),
            now,
          )
        : RESET_QUOTA_WINDOW_SECONDS;
      throw this.createRateLimitException(
        'reset request limit exceeded',
        retryAfterSeconds,
      );
    }

    const cooldownStart = new Date(
      now.getTime() - RESET_COOLDOWN_SECONDS * 1000,
    );
    const recent = await tx.f_password_reset_token.findFirst({
      where: { user_id: userId, created_at: { gt: cooldownStart } },
      orderBy: { created_at: 'desc' },
      select: { created_at: true },
    });
    if (recent) {
      const retryAfterSeconds = this.secondsUntil(
        new Date(
          recent.created_at.getTime() + RESET_COOLDOWN_SECONDS * 1000,
        ),
        now,
      );
      throw this.createRateLimitException(
        'wait for 2 minutes before sending a new request',
        retryAfterSeconds,
      );
    }
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
