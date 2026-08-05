import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { hashApiKey } from '../api-keys.util';

describe('ApiKeyGuard', () => {
  const repository = {
    findActiveByHash: jest.fn(),
    touchLastUsed: jest.fn(),
  };
  let guard: ApiKeyGuard;

  beforeEach(() => {
    jest.resetAllMocks();
    guard = new ApiKeyGuard(repository as never);
  });

  function ctx(req: Record<string, unknown>): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => req }),
    } as ExecutionContext;
  }

  it('rejects when x-api-key is absent', async () => {
    await expect(
      guard.canActivate(ctx({ headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects when the key is unknown or revoked (repo returns null)', async () => {
    repository.findActiveByHash.mockResolvedValue(null);
    await expect(
      guard.canActivate(ctx({ headers: { 'x-api-key': 'pk_bad' } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(repository.findActiveByHash).toHaveBeenCalledWith(
      hashApiKey('pk_bad'),
    );
  });

  it('accepts a valid key and attaches apiKeyOwnerId', async () => {
    repository.findActiveByHash.mockResolvedValue({
      id: 5,
      user_id: 42,
      last_used_at: null,
    });
    const req: Record<string, unknown> = {
      headers: { 'x-api-key': 'pk_good' },
    };
    await expect(guard.canActivate(ctx(req))).resolves.toBe(true);
    expect(req.apiKeyOwnerId).toBe(42);
  });

  it('updates last_used_at when it is null (stale)', async () => {
    repository.findActiveByHash.mockResolvedValue({
      id: 5,
      user_id: 42,
      last_used_at: null,
    });
    repository.touchLastUsed.mockResolvedValue(undefined);
    await guard.canActivate(ctx({ headers: { 'x-api-key': 'pk_good' } }));
    expect(repository.touchLastUsed).toHaveBeenCalledWith(5);
  });

  it('does NOT update last_used_at when it was used < 60s ago', async () => {
    repository.findActiveByHash.mockResolvedValue({
      id: 5,
      user_id: 42,
      last_used_at: new Date(),
    });
    await guard.canActivate(ctx({ headers: { 'x-api-key': 'pk_good' } }));
    expect(repository.touchLastUsed).not.toHaveBeenCalled();
  });
});
