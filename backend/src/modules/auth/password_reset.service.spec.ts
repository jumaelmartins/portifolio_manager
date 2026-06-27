import { BadRequestException, HttpException } from '@nestjs/common';
import { PasswordResetService } from './password_reset.service';

describe('PasswordResetService', () => {
  let prisma: {
    $transaction: jest.Mock;
    $executeRaw: jest.Mock;
    f_password_reset_token: {
      findUnique: jest.Mock;
      updateMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
    };
    f_user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let emailService: { sendPasswordResetEmail: jest.Mock };
  let hashService: { hashPassword: jest.Mock };
  let configService: { get: jest.Mock };
  let service: PasswordResetService;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
      $executeRaw: jest.fn().mockResolvedValue(1),
      f_password_reset_token: {
        findUnique: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      f_user: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma),
    );
    emailService = { sendPasswordResetEmail: jest.fn().mockResolvedValue(true) };
    hashService = { hashPassword: jest.fn().mockResolvedValue('hashed-password') };
    configService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
        if (key === 'FRONTEND_URL') return 'http://localhost:3001';
        return defaultValue;
      }),
    };
    service = new PasswordResetService(
      prisma as never,
      emailService as never,
      configService as never,
      hashService as never,
    );
  });

  describe('requestPasswordReset', () => {
    it('returns silently for an unknown email without sending an email', async () => {
      prisma.f_user.findUnique.mockResolvedValue(null);

      await expect(
        service.requestPasswordReset('unknown@example.com'),
      ).resolves.toBeUndefined();

      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('throws 400 for a Google OAuth account', async () => {
      prisma.f_user.findUnique.mockResolvedValue({
        id: 1,
        auth_method_id: 2,
        email: 'google@example.com',
        username: 'google',
      });

      await expect(
        service.requestPasswordReset('google@example.com'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.requestPasswordReset('google@example.com'),
      ).rejects.toThrow(
        "Esta conta usa login via Google. Acesse pelo botão 'Entrar com Google'.",
      );
    });

    it('throws 429 when the hourly limit of 3 requests is reached', async () => {
      prisma.f_user.findUnique.mockResolvedValue({
        id: 1,
        auth_method_id: 1,
        email: 'owner@example.com',
        username: 'owner',
      });
      prisma.f_password_reset_token.count.mockResolvedValue(3);
      prisma.f_password_reset_token.findFirst.mockResolvedValue({
        created_at: new Date(),
      });

      let caught: unknown;
      try {
        await service.requestPasswordReset('owner@example.com');
      } catch (e) {
        caught = e;
      }

      expect(caught).toBeInstanceOf(HttpException);
      expect((caught as HttpException).getStatus()).toBe(429);
      const response = (caught as HttpException).getResponse() as {
        message: string;
        retryAfterSeconds: number;
      };
      expect(response.message).toBe('reset request limit exceeded');
      expect(response.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('throws 429 when a request was made less than 2 minutes ago', async () => {
      prisma.f_user.findUnique.mockResolvedValue({
        id: 1,
        auth_method_id: 1,
        email: 'owner@example.com',
        username: 'owner',
      });
      // quota OK (< 3)
      prisma.f_password_reset_token.count.mockResolvedValue(1);
      // cooldown findFirst is the only findFirst call here (quota block is skipped)
      prisma.f_password_reset_token.findFirst.mockResolvedValue({
        created_at: new Date(Date.now() - 30_000),
      });

      let caught: unknown;
      try {
        await service.requestPasswordReset('owner@example.com');
      } catch (e) {
        caught = e;
      }

      expect(caught).toBeInstanceOf(HttpException);
      expect((caught as HttpException).getStatus()).toBe(429);
      const response = (caught as HttpException).getResponse() as {
        message: string;
        retryAfterSeconds: number;
      };
      expect(response.message).toBe('wait for 2 minutes before sending a new request');
      expect(response.retryAfterSeconds).toBeGreaterThan(0);
      expect(response.retryAfterSeconds).toBeLessThanOrEqual(120);
    });

    it('invalidates previous tokens, creates a new one, and sends the reset email', async () => {
      prisma.f_user.findUnique.mockResolvedValue({
        id: 42,
        auth_method_id: 1,
        email: 'owner@example.com',
        username: 'owner',
      });

      await service.requestPasswordReset('owner@example.com');

      expect(prisma.f_password_reset_token.updateMany).toHaveBeenCalledWith({
        where: { user_id: 42, is_used: false },
        data: { is_used: true, used_at: expect.any(Date) },
      });
      expect(prisma.f_password_reset_token.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 42,
          token: expect.stringMatching(/^[0-9a-f]{64}$/),
          expires_at: expect.any(Date),
        }),
      });
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'owner@example.com',
        'owner',
        expect.stringContaining('/reset-password?token='),
        1800,
      );
    });

    it('deletes the orphaned token when the email fails to send', async () => {
      prisma.f_user.findUnique.mockResolvedValue({
        id: 42,
        auth_method_id: 1,
        email: 'owner@example.com',
        username: 'owner',
      });
      emailService.sendPasswordResetEmail.mockResolvedValue(false);
      // Also mock the delete call
      (prisma.f_password_reset_token as any).delete = jest.fn().mockResolvedValue({});

      await expect(
        service.requestPasswordReset('owner@example.com'),
      ).rejects.toThrow('error sending password reset email');

      expect((prisma.f_password_reset_token as any).delete).toHaveBeenCalledWith({
        where: { token: expect.any(String) },
      });
    });
  });

  describe('resetPassword', () => {
    it('throws 400 for an unknown token', async () => {
      prisma.f_password_reset_token.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword('bad-token', 'NewP@ss1'),
      ).rejects.toThrow('Link inválido ou expirado.');
    });

    it('throws 400 for an already-used token', async () => {
      prisma.f_password_reset_token.findUnique.mockResolvedValue({
        token: 'tok',
        user_id: 1,
        is_used: true,
        expires_at: new Date(Date.now() + 60_000),
      });

      await expect(
        service.resetPassword('tok', 'NewP@ss1'),
      ).rejects.toThrow('Este link já foi utilizado.');
    });

    it('throws 400 for an expired token', async () => {
      prisma.f_password_reset_token.findUnique.mockResolvedValue({
        token: 'tok',
        user_id: 1,
        is_used: false,
        expires_at: new Date(Date.now() - 60_000),
      });

      await expect(
        service.resetPassword('tok', 'NewP@ss1'),
      ).rejects.toThrow('Link expirado. Solicite um novo.');
    });

    it('hashes the new password, marks the token used, and updates the user', async () => {
      prisma.f_password_reset_token.findUnique.mockResolvedValue({
        token: 'tok',
        user_id: 42,
        is_used: false,
        expires_at: new Date(Date.now() + 60_000),
      });
      // Simulate the atomic consume succeeding (count:1 means exactly one row was updated)
      prisma.f_password_reset_token.updateMany.mockResolvedValue({ count: 1 });

      await service.resetPassword('tok', 'NewP@ss1');

      expect(hashService.hashPassword).toHaveBeenCalledWith('NewP@ss1');
      expect(prisma.f_password_reset_token.updateMany).toHaveBeenCalledWith({
        where: { token: 'tok', is_used: false, expires_at: { gt: expect.any(Date) } },
        data: { is_used: true, used_at: expect.any(Date) },
      });
      expect(prisma.f_user.update).toHaveBeenCalledWith({
        where: { id: 42 },
        data: { password_hash: 'hashed-password' },
      });
    });
  });
});
