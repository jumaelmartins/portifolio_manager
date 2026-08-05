import { PublicKeyThrottlerGuard } from './public-key-throttler.guard';
import { hashApiKey } from '../api-keys/api-keys.util';

describe('PublicKeyThrottlerGuard.getTracker', () => {
  const guard = new PublicKeyThrottlerGuard(
    {} as never,
    {} as never,
    {} as never,
  );
  const getTracker = (req: Record<string, unknown>) =>
    (guard as unknown as {
      getTracker(r: Record<string, unknown>): Promise<string>;
    }).getTracker(req);

  it('keys by the hashed api key when present', async () => {
    await expect(
      getTracker({ headers: { 'x-api-key': 'pk_x' }, ip: '1.1.1.1' }),
    ).resolves.toBe(`k:${hashApiKey('pk_x')}`);
  });

  it('falls back to the client ip when no key is present', async () => {
    await expect(getTracker({ headers: {}, ip: '1.1.1.1' })).resolves.toBe(
      'ip:1.1.1.1',
    );
  });
});
