import { HttpException } from '@nestjs/common';
import { EmailVerificationService } from './email_verification_token.service';

describe('EmailVerificationService transactions', () => {
  const user = {
    id: 42,
    email: 'owner@example.com',
    verified_email: false,
  };
  const verificationToken = {
    id: 'challenge-id',
    token: 'a'.repeat(64),
    code: '123456',
    user_id: user.id,
    expires_at: new Date(Date.now() + 60_000),
    is_used: false,
    failed_attempts: 0,
    f_user: { email: user.email },
  };

  function createHarness() {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      f_user: {
        findUnique: jest.fn().mockResolvedValue(user),
        update: jest.fn().mockResolvedValue({}),
      },
      f_email_verification_token: {
        findUnique: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue({}),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        async (callback: (transaction: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
      f_user: {
        findUnique: jest.fn().mockResolvedValue(user),
      },
      f_email_verification_token: {
        findUnique: jest.fn(),
      },
    };
    const emailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(true),
      sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    };
    const configService = {
      get: jest.fn().mockReturnValue(30),
    };
    const service = new EmailVerificationService(
      prisma as never,
      emailService as never,
      configService as never,
    );

    return { service, prisma, tx, emailService };
  }

  it('serializes initial challenge replacement with a user advisory lock', async () => {
    const { service, prisma, tx } = createHarness();
    let advisorySql: readonly string[] | undefined;
    let advisoryUserId: number | undefined;
    let invalidationQuery:
      | {
          where: { user_id: number; is_used: boolean };
          data: { is_used: boolean; used_at: Date };
        }
      | undefined;
    tx.$executeRaw.mockImplementation(
      (strings: TemplateStringsArray, userId: number) => {
        advisorySql = strings;
        advisoryUserId = userId;
        return Promise.resolve(1);
      },
    );
    tx.f_email_verification_token.updateMany.mockImplementation(
      (query: unknown) => {
        invalidationQuery = query as typeof invalidationQuery;
        return Promise.resolve({ count: 1 });
      },
    );

    await service.sendVerificationEmail(user.id);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(advisorySql?.join('')).toContain('pg_advisory_xact_lock');
    expect(advisoryUserId).toBe(user.id);
    expect(tx.f_email_verification_token.count).not.toHaveBeenCalled();
    expect(tx.f_email_verification_token.findFirst).not.toHaveBeenCalled();
    expect(invalidationQuery).toBeDefined();
    const capturedInvalidation = invalidationQuery!;
    expect(capturedInvalidation).toEqual({
      where: { user_id: user.id, is_used: false },
      data: {
        is_used: true,
        used_at: capturedInvalidation.data.used_at,
      },
    });
    expect(capturedInvalidation.data.used_at).toBeInstanceOf(Date);
    expect(tx.f_email_verification_token.create).toHaveBeenCalledTimes(1);
  });

  it('serializes concurrent resends so only the first passes the cooldown', async () => {
    const { service, prisma, tx, emailService } = createHarness();
    let challengeCount = 0;
    let transactionQueue = Promise.resolve();

    prisma.$transaction.mockImplementation(
      (callback: (transaction: typeof tx) => Promise<unknown>) => {
        const result = transactionQueue.then(() => callback(tx));
        transactionQueue = result.then(
          () => undefined,
          () => undefined,
        );
        return result;
      },
    );
    tx.f_email_verification_token.count.mockImplementation(() =>
      Promise.resolve(challengeCount),
    );
    tx.f_email_verification_token.findFirst.mockImplementation(
      (query: { orderBy?: { created_at: 'asc' | 'desc' } }) => {
        if (query.orderBy?.created_at === 'asc') {
          return Promise.resolve({
            created_at: new Date(Date.now() - 30 * 60 * 1000),
          });
        }
        return Promise.resolve(
          challengeCount > 0 ? { created_at: new Date() } : null,
        );
      },
    );
    tx.f_email_verification_token.create.mockImplementation(() => {
      challengeCount += 1;
      return Promise.resolve({});
    });

    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () =>
        service.resendVerificationEmail(user.email),
      ),
    );

    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    const rejected = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    expect(rejected).toHaveLength(7);
    for (const result of rejected) {
      expect(result.reason).toBeInstanceOf(HttpException);
      const exception = result.reason as HttpException;
      expect(exception.getStatus()).toBe(429);
      const response = exception.getResponse() as {
        message: string;
        retryAfterSeconds: number;
      };
      expect(response.message).toBe(
        'wait for 2 minutes before send new request email',
      );
      expect(response.retryAfterSeconds).toBeGreaterThan(0);
    }
    expect(tx.f_email_verification_token.create).toHaveBeenCalledTimes(1);
    expect(emailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
  });

  it('returns HTTP 429 with retry timing during the resend cooldown', async () => {
    const { service, tx, emailService } = createHarness();
    tx.f_email_verification_token.count.mockResolvedValue(1);
    tx.f_email_verification_token.findFirst.mockResolvedValue({
      created_at: new Date(Date.now() - 30_000),
    });

    let caught: unknown;
    try {
      await service.resendVerificationEmail(user.email);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(HttpException);
    const exception = caught as HttpException;
    expect(exception.getStatus()).toBe(429);
    const response = exception.getResponse() as {
      message: string;
      retryAfterSeconds: number;
    };
    expect(response.message).toBe(
      'wait for 2 minutes before send new request email',
    );
    expect(response.retryAfterSeconds).toBeGreaterThan(0);
    expect(tx.f_email_verification_token.create).not.toHaveBeenCalled();
    expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('rolls back activation when the user update fails and sends no welcome email', async () => {
    const { service, tx, emailService } = createHarness();
    tx.f_email_verification_token.findUnique.mockResolvedValue(
      verificationToken,
    );
    tx.f_email_verification_token.updateMany.mockResolvedValue({ count: 1 });
    tx.f_user.update.mockRejectedValue(new Error('activation failed'));

    await expect(
      service.verifyEmailWithCode(
        verificationToken.token,
        verificationToken.code,
      ),
    ).rejects.toThrow('activation failed');

    expect(tx.f_email_verification_token.updateMany).toHaveBeenCalled();
    expect(tx.f_user.update).toHaveBeenCalled();
    expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it('re-reads a failed concurrent consumption and reports the token as used', async () => {
    const { service, prisma, tx, emailService } = createHarness();
    tx.f_email_verification_token.findUnique.mockResolvedValue(
      verificationToken,
    );
    tx.f_email_verification_token.updateMany.mockResolvedValue({ count: 0 });
    prisma.f_email_verification_token.findUnique.mockResolvedValue({
      ...verificationToken,
      is_used: true,
    });

    await expect(
      service.verifyEmailWithCode(
        verificationToken.token,
        verificationToken.code,
      ),
    ).rejects.toThrow('token already in use');

    expect(prisma.f_email_verification_token.findUnique).toHaveBeenCalledWith({
      where: { token: verificationToken.token },
    });
    expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it('sends the welcome email only after the verification transaction commits', async () => {
    const { service, prisma, tx, emailService } = createHarness();
    let committed = false;
    tx.f_email_verification_token.findUnique.mockResolvedValue(
      verificationToken,
    );
    tx.f_email_verification_token.updateMany.mockResolvedValue({ count: 1 });
    prisma.$transaction.mockImplementation(
      async (callback: (transaction: typeof tx) => Promise<unknown>) => {
        const result = await callback(tx);
        committed = true;
        return result;
      },
    );
    emailService.sendWelcomeEmail.mockImplementation(() => {
      expect(committed).toBe(true);
      return Promise.resolve(true);
    });

    await expect(
      service.verifyEmailWithCode(
        verificationToken.token,
        verificationToken.code,
      ),
    ).resolves.toBe(true);

    expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
      user.email,
      'owner',
    );
  });
});
