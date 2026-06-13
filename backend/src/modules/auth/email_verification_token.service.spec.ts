import { BadRequestException } from '@nestjs/common';
import { EmailVerificationService } from './email_verification_token.service';

describe('EmailVerificationService security limits', () => {
  const verificationToken = {
    id: 'challenge-id',
    token: 'a'.repeat(64),
    code: '123456',
    user_id: 42,
    expires_at: new Date(Date.now() + 60_000),
    is_used: false,
    failed_attempts: 0,
    f_user: { email: 'owner@example.com' },
  };

  let prisma: {
    f_email_verification_token: {
      findUnique: jest.Mock;
      updateMany: jest.Mock;
      create: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
    };
    f_user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let emailService: {
    sendVerificationEmail: jest.Mock;
    sendWelcomeEmail: jest.Mock;
  };
  let service: EmailVerificationService;

  beforeEach(() => {
    prisma = {
      f_email_verification_token: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
      },
      f_user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    emailService = {
      sendVerificationEmail: jest.fn(),
      sendWelcomeEmail: jest.fn(),
    };
    service = new EmailVerificationService(
      prisma as never,
      emailService as never,
      { get: jest.fn() } as never,
    );
  });

  it('passes the generated expiry to the verification email template', async () => {
    let emailArguments:
      | [
          email: string,
          userName: string,
          code: string,
          token: string,
          expiresInSeconds: number,
        ]
      | undefined;
    prisma.f_user.findUnique.mockResolvedValue({
      id: 42,
      email: 'owner@example.com',
      verified_email: false,
    });
    prisma.f_email_verification_token.updateMany.mockResolvedValue({
      count: 1,
    });
    prisma.f_email_verification_token.create.mockResolvedValue({});
    emailService.sendVerificationEmail.mockImplementation(
      (...args: unknown[]) => {
        emailArguments = args as typeof emailArguments;
        return Promise.resolve(true);
      },
    );
    service = new EmailVerificationService(
      prisma as never,
      emailService as never,
      { get: jest.fn().mockReturnValue(30) } as never,
    );

    const challenge = await service.sendVerificationEmail(42);

    expect(challenge.token).toHaveLength(64);
    expect(challenge.expiresInSeconds).toBe(1800);
    expect(emailArguments).toBeDefined();
    expect(emailArguments![0]).toBe('owner@example.com');
    expect(emailArguments![1]).toBe('owner');
    expect(emailArguments![2]).toMatch(/^\d{6}$/);
    expect(emailArguments![3]).toHaveLength(64);
    expect(emailArguments![4]).toBe(1800);
  });

  it('accepts only five failed attempts using an atomic counter constraint', async () => {
    prisma.f_email_verification_token.findUnique.mockResolvedValue(
      verificationToken,
    );
    prisma.f_email_verification_token.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(
        service.verifyEmailWithCode(verificationToken.token, '000000'),
      ).rejects.toThrow('invalid code');
    }
    await expect(
      service.verifyEmailWithCode(verificationToken.token, '000000'),
    ).rejects.toThrow('too many verification attempts');

    expect(prisma.f_email_verification_token.updateMany).toHaveBeenCalledTimes(
      6,
    );
    for (const [query] of prisma.f_email_verification_token.updateMany.mock
      .calls) {
      expect(query).toEqual({
        where: {
          id: verificationToken.id,
          is_used: false,
          failed_attempts: { lt: 5 },
        },
        data: { failed_attempts: { increment: 1 } },
      });
    }
  });

  it('rejects a correct code when atomic consumption loses to a lock', async () => {
    let consumptionQuery:
      | {
          where: {
            id: string;
            is_used: boolean;
            expires_at: { gt: Date };
            failed_attempts: { lt: number };
          };
          data: { is_used: boolean; used_at: Date };
        }
      | undefined;
    prisma.f_email_verification_token.findUnique.mockResolvedValue({
      ...verificationToken,
      failed_attempts: 4,
    });
    prisma.f_email_verification_token.updateMany.mockImplementation(
      (query: unknown) => {
        consumptionQuery = query as typeof consumptionQuery;
        return Promise.resolve({ count: 0 });
      },
    );

    await expect(
      service.verifyEmailWithCode(
        verificationToken.token,
        verificationToken.code,
      ),
    ).rejects.toThrow('too many verification attempts');

    expect(consumptionQuery).toBeDefined();
    const capturedConsumption = consumptionQuery!;
    expect(capturedConsumption).toEqual({
      where: {
        id: verificationToken.id,
        is_used: false,
        expires_at: { gt: capturedConsumption.where.expires_at.gt },
        failed_attempts: { lt: 5 },
      },
      data: {
        is_used: true,
        used_at: capturedConsumption.data.used_at,
      },
    });
    expect(capturedConsumption.where.expires_at.gt).toBeInstanceOf(Date);
    expect(capturedConsumption.data.used_at).toBeInstanceOf(Date);
    expect(prisma.f_user.update).not.toHaveBeenCalled();
  });

  it('rejects resend after five challenges in the last hour', async () => {
    let countQuery:
      | {
          where: {
            user_id: number;
            created_at: { gt: Date };
          };
        }
      | undefined;
    prisma.f_user.findUnique.mockResolvedValue({
      id: 42,
      email: 'owner@example.com',
      verified_email: false,
    });
    prisma.f_email_verification_token.count.mockImplementation(
      (query: unknown) => {
        countQuery = query as typeof countQuery;
        return Promise.resolve(5);
      },
    );

    await expect(
      service.resendVerificationEmail('owner@example.com'),
    ).rejects.toThrow(
      new BadRequestException('verification request limit exceeded'),
    );

    expect(countQuery).toBeDefined();
    const capturedCount = countQuery!;
    expect(capturedCount).toEqual({
      where: {
        user_id: 42,
        created_at: { gt: capturedCount.where.created_at.gt },
      },
    });
    expect(capturedCount.where.created_at.gt).toBeInstanceOf(Date);
    expect(prisma.f_email_verification_token.findFirst).not.toHaveBeenCalled();
  });
});
