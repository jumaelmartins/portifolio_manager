import { ipRateTracker, keyRateTracker } from './public-throttlers';
import { hashApiKey } from '../api-keys/api-keys.util';

describe('public throttler trackers', () => {
  it('ipRateTracker keys by client ip, ignoring any presented key', () => {
    expect(ipRateTracker({ headers: {}, ip: '1.1.1.1' })).toBe('ip:1.1.1.1');
    expect(
      ipRateTracker({ headers: { 'x-api-key': 'pk_x' }, ip: '2.2.2.2' }),
    ).toBe('ip:2.2.2.2');
  });

  it('keyRateTracker keys by the hashed api key when present', () => {
    expect(
      keyRateTracker({ headers: { 'x-api-key': 'pk_x' }, ip: '1.1.1.1' }),
    ).toBe(`k:${hashApiKey('pk_x')}`);
  });

  it('keyRateTracker falls back to the client ip when no key', () => {
    expect(keyRateTracker({ headers: {}, ip: '1.1.1.1' })).toBe('ip:1.1.1.1');
  });
});
