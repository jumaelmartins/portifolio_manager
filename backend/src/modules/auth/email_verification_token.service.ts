import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
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
    // Gera token único (UUID-like)
    const token = randomBytes(32).toString('hex');

    // Gera código de 6 dígitos
    const code = randomInt(100000, 999999).toString();

    // Tempo de expiração (30 minutos)
    const expirationMinutes = this.configService.get<number>(
      'EMAIL_VERIFICATION_EXPIRATION',
      30,
    );
    const expires_at = new Date(Date.now() + expirationMinutes * 60 * 1000);

    // Invalida tokens anteriores do usuário (opcional)
    await this.prisma.f_email_verification_token.updateMany({
      where: {
        user_id,
        is_used: false,
        expires_at: { gt: new Date() },
      },
      data: { is_used: true },
    });

    // Cria novo token
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

  /**
   * Envia email de verificação para o usuário
   */
  async sendVerificationEmail(user_id: number): Promise<boolean> {
    const user = await this.prisma.f_user.findUnique({
      where: { id: user_id },
    });

    if (!user) {
      throw new NotFoundException('user not fount');
    }

    if (user.verified_email) {
      throw new BadRequestException('email already verified');
    }

    // Gera novo token
    const { token, code } = await this.generateVerificationToken(user_id);

    // Extrai nome do email (parte antes do @)
    const userName = user.email.split('@')[0];

    // Envia email
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

  /**
   * Verifica o código/token de verificação
   */
  async verifyEmailWithCode(token: string, code: string): Promise<boolean> {
    // Busca o token no banco
    const verificationToken =
      await this.prisma.f_email_verification_token.findUnique({
        where: { token },
        include: { f_user: true },
      });

    if (!verificationToken) {
      throw new BadRequestException('invalid verification token');
    }

    // Verifica se o token já foi usado
    if (verificationToken.is_used) {
      throw new BadRequestException('token already in use');
    }

    // Verifica se o token expirou
    if (verificationToken.expires_at < new Date()) {
      throw new BadRequestException('expired token');
    }

    // Verifica se o código está correto
    if (verificationToken.code !== code) {
      throw new BadRequestException('invalid code');
    }

    // Marca o token como usado
    await this.prisma.f_email_verification_token.update({
      where: { id: verificationToken.id },
      data: {
        is_used: true,
        used_at: new Date(),
      },
    });

    // Ativa e verifica o usuário
    await this.prisma.f_user.update({
      where: { id: verificationToken.user_id },
      data: {
        verified_email: true,
        status_id: 2,
        email_verified_at: new Date(),
      },
    });

    // Envia email de boas-vindas
    const userName = verificationToken.f_user.email.split('@')[0];
    await this.emailService.sendWelcomeEmail(
      verificationToken.f_user.email,
      userName,
    );

    return true;
  }

  /**
   * Verifica apenas com o token (sem código)
   */
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

    // Para verificação apenas com token, retorna as informações
    // mas não marca como verificado (usuário ainda precisa do código)
    return false;
  }

  /**
   * Reenviar email de verificação
   */
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

    // Verifica se há um token recente (evita spam)
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

  /**
   * Limpa tokens expirados (job para executar periodicamente)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.f_email_verification_token.deleteMany({
      where: {
        expires_at: { lt: new Date() },
      },
    });

    return result.count;
  }

  /**
   * Verifica status de verificação de um usuário
   */
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
