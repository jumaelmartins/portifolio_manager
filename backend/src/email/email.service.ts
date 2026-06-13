import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.createTransporter();
  }

  private createTransporter() {
    if (this.configService.get<string>('EMAIL_TRANSPORT') === 'json') {
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
      return;
    }

    // this.transporter = nodemailer.createTransport({
    //   service: 'gmail',
    //   auth: {
    //     user: this.configService.get<string>('EMAIL_USER'),
    //     pass: this.configService.get<string>('EMAIL_PASSWORD'),
    //   },
    // });

    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST_DEV,
      port: 2525,
      auth: {
        user: process.env.EMAIL_USERNAME_DEV,
        pass: process.env.EMAIL_PASSWORD_DEV,
      },
      ignoreTLS: true,
    });
  }

  async sendVerificationEmail(
    email: string,
    userName: string,
    verificationCode: string,
    verificationToken: string,
  ): Promise<boolean> {
    try {
      const frontendUrl = this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3001',
      );
      const verificationUrl =
        `${frontendUrl}/api/auth/verification-link` +
        `?token=${encodeURIComponent(verificationToken)}` +
        `&email=${encodeURIComponent(email)}`;

      const htmlContent = this.getVerificationEmailTemplate(
        userName,
        verificationCode,
        verificationUrl,
      );

      const mailOptions = {
        from: {
          name: 'Sistema de Autenticação',
          address: this.configService.get<string>(
            'EMAIL_FROM',
            'noreply@sistema.com',
          ),
        },
        to: email,
        subject: '🔐 Confirme seu email - Código de Verificação',
        html: htmlContent,
      };

      const result = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Email de verificação enviado para: ${email}`);
      this.logger.debug(`Message ID: ${result.messageId}`);

      return true;
    } catch (error) {
      this.logger.error(`Erro ao enviar email para ${email}:`, error);
      return false;
    }
  }

  private getVerificationEmailTemplate(
    userName: string,
    code: string,
    verificationUrl: string,
  ): string {
    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verificação de Email</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
            .code-box { background: #f8f9fa; border: 2px dashed #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
            .code { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 8px; font-family: monospace; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; text-align: center; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0; color: #856404; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Verificação de Email</h1>
                <p>Olá, ${userName}!</p>
            </div>
            
            <p>Obrigado por se cadastrar! Para ativar sua conta, você precisa verificar seu endereço de email.</p>
            
            <div class="code-box">
                <p><strong>Seu código de verificação:</strong></p>
                <div class="code">${code}</div>
                <p><small>Este código expira em 30 minutos</small></p>
            </div>
            
            <p>Você pode:</p>
            <ul>
                <li><strong>Opção 1:</strong> Clique no botão abaixo e digite o código:</li>
            </ul>
            
            <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">✅ Verificar Email</a>
            </div>
            
            <ul>
                <li><strong>Opção 2:</strong> Acesse manualmente: <br>
                    <code>${verificationUrl}</code><br>
                    E digite o código: <strong>${code}</strong>
                </li>
            </ul>
            
            <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul>
                    <li>Este código expira em <strong>30 minutos</strong></li>
                    <li>Você só pode usar este código uma vez</li>
                    <li>Se não foi você que se cadastrou, ignore este email</li>
                </ul>
            </div>
            
            <div class="footer">
                <p>Se você não solicitou esta verificação, pode ignorar este email.</p>
                <p><small>Este é um email automático, não responda a esta mensagem.</small></p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: {
          name: 'Sistema de Autenticação',
          address: this.configService.get<string>(
            'EMAIL_FROM',
            'noreply@sistema.com',
          ),
        },
        to: email,
        subject: '🎉 Bem-vindo! Sua conta foi verificada com sucesso',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #28a745;">🎉 Conta Verificada!</h1>
            <p>Olá, ${userName}!</p>
          </div>
          <p>Sua conta foi verificada com sucesso! Agora você pode aproveitar todos os recursos da nossa plataforma.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.configService.get<string>('APP_URL', 'http://localhost:3000')}/auth/login" 
               style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">
              🚀 Fazer Login
            </a>
          </div>
          <p>Obrigado por se juntar a nós!</p>
        </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de boas-vindas enviado para: ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Erro ao enviar email de boas-vindas:`, error);
      return false;
    }
  }
}
