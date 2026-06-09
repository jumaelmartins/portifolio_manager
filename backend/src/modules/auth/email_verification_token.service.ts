import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../email/email.service';
import { ConfigService } from '@nestjs/config';
import { randomBytes, randomInt } from 'crypto';

@Injectable()
export class EmailVerificationService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async generateVerificationToken(
    user_id: number,
  ): Promise<{ token: string; code: string }> {

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

    return { token, code };
  }

  async sendVerificationEmail(user_id: number): Promise<boolean> {
    const user = await this.prisma.f_user.findUnique({
      where: { id: user_id },
    });

    if (!user) {
      throw new NotFoundException('user not found');
    }
    if (user.verified_email) {
      throw new BadRequestException('email already verified');
    }

    const { token, code } = await this.generateVerificationToken(user_id);

    const userName = user.email.split('@')[0];

    const emailSent = await this.emailService.sendVerificationEmail(
      user.email,
      userName,
      code,
      token,
    );

    if (!emailSent) {
      throw new BadRequestException('error to send verification email');
    }

    return true;
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

    if (verificationToken.code !== code) {
      throw new BadRequestException('invalid code');
    }

    await this.prisma.f_email_verification_token.update({
      where: { id: verificationToken.id },
      data: {
        is_used: true,
        used_at: new Date(),
      },
    });

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

  async resendVerificationEmail(email: string): Promise<boolean> {
    const user = await this.prisma.f_user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    if (user.verified_email) {
      throw new BadRequestException('email already verified');
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

    return await this.sendVerificationEmail(user.id);
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
