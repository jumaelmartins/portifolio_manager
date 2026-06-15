import { UsersService } from './users.service';

describe('UsersService authentication contracts', () => {
  const userRepository = {
    findByEmailWithPassword: jest.fn(),
    update: jest.fn(),
  };
  const hashService = {
    comparePassword: jest.fn(),
  };
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(userRepository as never, hashService as never);
  });

  it('returns a pending user after valid credentials so login can request verification', async () => {
    userRepository.findByEmailWithPassword.mockResolvedValue({
      id: 42,
      email: 'pending@example.com',
      password_hash: 'hashed-password',
      status_id: 1,
      verified_email: false,
    });
    hashService.comparePassword.mockResolvedValue(true);
    userRepository.update.mockResolvedValue({});

    await expect(
      service.validateUser('pending@example.com', 'valid-password'),
    ).resolves.toEqual({
      id: 42,
      email: 'pending@example.com',
      status_id: 1,
      verified_email: false,
    });
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('records the last login for verified active credentials', async () => {
    userRepository.findByEmailWithPassword.mockResolvedValue({
      id: 7,
      email: 'active@example.com',
      password_hash: 'hashed-password',
      status_id: 2,
      verified_email: true,
    });
    hashService.comparePassword.mockResolvedValue(true);
    userRepository.update.mockResolvedValue({});

    await service.validateUser('active@example.com', 'valid-password');

    const [updatedUserId, update] = userRepository.update.mock
      .calls[0] as unknown as [number, { last_login: Date }];
    expect(updatedUserId).toBe(7);
    expect(update.last_login).toBeInstanceOf(Date);
  });
});
