import * as nodemailer from 'nodemailer';
import { EmailService } from './email.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('EmailService configuration', () => {
  let sentMailOptions: { from: unknown; html: unknown } | undefined;
  const sendMail = jest.fn((mailOptions: unknown) => {
    sentMailOptions = mailOptions as { from: unknown; html: unknown };
    return Promise.resolve({ messageId: 'message-id' });
  });
  const createTransport = nodemailer.createTransport as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    sentMailOptions = undefined;
    createTransport.mockReturnValue({ sendMail });
  });

  it('uses configured SMTP security, numeric port, sender, and dynamic expiry', async () => {
    const values: Record<string, unknown> = {
      EMAIL_TRANSPORT: 'smtp',
      EMAIL_HOST_DEV: 'smtp.example.com',
      EMAIL_PORT_DEV: '465',
      EMAIL_SECURE: 'true',
      EMAIL_USERNAME_DEV: 'smtp-user',
      EMAIL_PASSWORD_DEV: 'smtp-password',
      EMAIL_FROM: 'Portfolio Manager <noreply@example.com>',
      FRONTEND_URL: 'http://localhost:3001',
    };
    const configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        return values[key] ?? defaultValue;
      }),
    };
    const service = new EmailService(configService as never);

    await (
      service.sendVerificationEmail as unknown as (
        email: string,
        userName: string,
        verificationCode: string,
        verificationToken: string,
        expiresInSeconds: number,
      ) => Promise<boolean>
    )('owner@example.com', 'owner', '123456', 'a'.repeat(64), 301);

    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      auth: {
        user: 'smtp-user',
        pass: 'smtp-password',
      },
    });
    expect(sentMailOptions).toBeDefined();
    const mailOptions = sentMailOptions!;
    expect(mailOptions.from).toBe('Portfolio Manager <noreply@example.com>');
    expect(mailOptions.html).toEqual(expect.stringContaining('6 minutos'));
  });

  it('uses the frontend URL in the welcome email login link', async () => {
    const values: Record<string, unknown> = {
      EMAIL_TRANSPORT: 'json',
      EMAIL_FROM: 'Portfolio Manager <noreply@example.com>',
      FRONTEND_URL: 'https://portfolio.example',
      APP_URL: 'https://legacy.example',
    };
    const configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        return values[key] ?? defaultValue;
      }),
    };
    const service = new EmailService(configService as never);

    await service.sendWelcomeEmail('owner@example.com', 'owner');

    expect(sentMailOptions).toBeDefined();
    expect(sentMailOptions!.html).toEqual(
      expect.stringContaining('href="https://portfolio.example/auth/login"'),
    );
    expect(sentMailOptions!.html).not.toEqual(
      expect.stringContaining('https://legacy.example'),
    );
  });
});
