import { GUARDS_METADATA } from '@nestjs/common/constants';
import type { Response } from 'express';
import { ActiveUserGuard } from './guards/active-user.guard';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

describe('AuthController security contracts', () => {
  const usersService = {
    findOne: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn(),
  };
  const emailVerificationService = {
    resendVerificationEmail: jest.fn(),
  };
  const configService = {
    get: jest.fn(),
  };
  const passwordResetService = {
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
  };
  let controller: AuthController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController(
      usersService as never,
      jwtService as never,
      emailVerificationService as never,
      configService as never,
      passwordResetService as never,
    );
  });

  it('sets no-store browser headers and posts the token outside the URL', () => {
    jwtService.sign.mockReturnValue('signed-jwt');
    configService.get.mockReturnValue('http://localhost:3001');
    let sentHtml = '';
    const send = jest.fn((html: string) => {
      sentHtml = html;
    });
    const response = {
      setHeader: jest.fn(),
      type: jest.fn(),
      send,
    };
    response.type.mockReturnValue(response);

    controller.googleAuthCallback(
      {
        query: { state: 'oauth-state' },
        user: { id: 7, role_id: 2, status_id: 2 },
      },
      response as unknown as Response,
    );

    expect(response.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'no-store',
    );
    expect(response.setHeader).toHaveBeenCalledWith('Pragma', 'no-cache');
    expect(response.setHeader).toHaveBeenCalledWith(
      'Referrer-Policy',
      'no-referrer',
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Security-Policy',
      expect.stringContaining("default-src 'none'"),
    );
    expect(sentHtml).toContain('value="signed-jwt"');
    expect(sentHtml).toContain(
      'action="http://localhost:3001/api/auth/google/callback"',
    );
    expect(sentHtml).not.toContain('?token=');
  });

  it('returns resend challenge without a verification code', async () => {
    emailVerificationService.resendVerificationEmail.mockResolvedValue({
      token: 'challenge-token',
      expiresInSeconds: 1800,
    });

    const response = await controller.resendVerification({
      email: 'owner@example.com',
    });

    expect(JSON.stringify(response)).not.toContain('"code"');
  });

  it('returns the authenticated user and declares both auth guards', async () => {
    usersService.findOne.mockResolvedValue({ id: 42 });

    await expect(
      controller.me({
        user: { sub: '42', role: '2', status: '2' },
      } as never),
    ).resolves.toEqual({ id: 42 });
    expect(usersService.findOne).toHaveBeenCalledWith(42);

    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      AuthController.prototype.me,
    ) as unknown[];
    expect(guards).toEqual([JwtAuthGuard, ActiveUserGuard]);
  });

  it('forgotPassword always returns a generic 200 message', async () => {
    passwordResetService.requestPasswordReset.mockResolvedValue(undefined);

    const response = await controller.forgotPassword({
      email: 'owner@example.com',
    });

    expect(response).toEqual({
      message:
        'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.',
    });
    expect(passwordResetService.requestPasswordReset).toHaveBeenCalledWith(
      'owner@example.com',
    );
  });

  it('resetPassword returns a success message', async () => {
    passwordResetService.resetPassword.mockResolvedValue(undefined);

    const response = await controller.resetPassword({
      token: 'abc123',
      password: 'NewP@ss1',
    });

    expect(response).toEqual({ message: 'Senha redefinida com sucesso!' });
    expect(passwordResetService.resetPassword).toHaveBeenCalledWith(
      'abc123',
      'NewP@ss1',
    );
  });
});
