import { NotFoundException } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { hashApiKey } from './api-keys.util';

describe('ApiKeysService', () => {
  const repository = {
    create: jest.fn(),
    findAllByUser: jest.fn(),
    findActiveByHash: jest.fn(),
    revoke: jest.fn(),
    touchLastUsed: jest.fn(),
  };
  let service: ApiKeysService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ApiKeysService(repository as never);
  });

  it('create returns the full plaintext key once and persists prefix + hash (not plaintext)', async () => {
    repository.create.mockImplementation(async (data) => ({
      id: 1,
      user_id: 7,
      label: data.label,
      key_prefix: data.keyPrefix,
      key_hash: data.keyHash,
      created_at: new Date('2026-08-04T00:00:00.000Z'),
      last_used_at: null,
      revoked_at: null,
    }));

    const result = await service.create(7, { label: 'site' });

    expect(result.key).toMatch(/^pk_[0-9a-f]{48}$/);
    expect(result).toMatchObject({ id: 1, label: 'site' });
    expect(result.key_prefix).toBe(result.key.slice(0, 10));

    const persisted = repository.create.mock.calls[0][0];
    expect(persisted.userId).toBe(7);
    expect(persisted.keyPrefix).toBe(result.key.slice(0, 10));
    expect(persisted.keyHash).toBe(hashApiKey(result.key));
    expect(Object.keys(persisted)).not.toContain('key'); // plaintext never persisted
  });

  it('list maps keys without exposing key_hash or plaintext', async () => {
    repository.findAllByUser.mockResolvedValue([
      {
        id: 1,
        user_id: 7,
        label: 'a',
        key_prefix: 'pk_aaaaaaa',
        key_hash: 'HASH',
        created_at: new Date(),
        last_used_at: null,
        revoked_at: null,
      },
    ]);

    const result = await service.list(7);

    expect(repository.findAllByUser).toHaveBeenCalledWith(7);
    expect(result[0]).not.toHaveProperty('key_hash');
    expect(result[0]).not.toHaveProperty('key');
    expect(result[0]).toMatchObject({
      id: 1,
      label: 'a',
      key_prefix: 'pk_aaaaaaa',
    });
  });

  it('revoke delegates to the repository with owner scope', async () => {
    repository.revoke.mockResolvedValue(1);
    await expect(service.revoke(7, 1)).resolves.toBeUndefined();
    expect(repository.revoke).toHaveBeenCalledWith(1, 7);
  });

  it('revoke throws NotFound when nothing was revoked (not owned)', async () => {
    repository.revoke.mockResolvedValue(0);
    await expect(service.revoke(7, 99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
