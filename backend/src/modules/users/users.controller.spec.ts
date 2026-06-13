import { BadRequestException, Logger } from '@nestjs/common';
import { UsersController } from './users.controller';

describe('UsersController registration security contracts', () => {
  const usersService = {
    create: jest.fn(),
    delete: jest.fn(),
  };
  const emailVerificationService = {
    sendVerificationEmail: jest.fn(),
  };
  let controller: UsersController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new UsersController(
      usersService as never,
      emailVerificationService as never,
    );
  });

  it('returns a verification challenge without the code', async () => {
    usersService.create.mockResolvedValue({
      id: 42,
      email: 'owner@example.com',
    });
    emailVerificationService.sendVerificationEmail.mockResolvedValue({
      token: 'challenge-token',
      expiresInSeconds: 1800,
    });

    const response = await controller.create({
      email: 'owner@example.com',
      password: 'password',
    });

    expect(JSON.stringify(response)).not.toContain('"code"');
  });

  it('deletes a newly-created user and preserves the email HttpException', async () => {
    const loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const deliveryError = new BadRequestException(
      'error to send verification email',
    );
    usersService.create.mockResolvedValue({
      id: 42,
      email: 'owner@example.com',
    });
    emailVerificationService.sendVerificationEmail.mockRejectedValue(
      deliveryError,
    );
    usersService.delete.mockRejectedValue(new Error('cleanup failed'));

    await expect(
      controller.create({
        email: 'owner@example.com',
        password: 'password',
      }),
    ).rejects.toBe(deliveryError);
    expect(usersService.delete).toHaveBeenCalledWith(42);
    expect(loggerError).toHaveBeenCalledWith(
      'Failed to compensate user 42 after registration error',
      expect.any(Error),
    );
    loggerError.mockRestore();
  });
});
