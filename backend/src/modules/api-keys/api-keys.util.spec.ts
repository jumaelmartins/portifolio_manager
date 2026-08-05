import { createHash } from 'node:crypto';
import { generateApiKey, hashApiKey } from './api-keys.util';

describe('api-keys.util', () => {
  it('generateApiKey returns a pk_-prefixed 51-char hex key', () => {
    const { fullKey } = generateApiKey();
    expect(fullKey).toMatch(/^pk_[0-9a-f]{48}$/);
    expect(fullKey).toHaveLength(51);
  });

  it('keyPrefix is the first 10 chars of the full key', () => {
    const { fullKey, keyPrefix } = generateApiKey();
    expect(keyPrefix).toBe(fullKey.slice(0, 10));
    expect(keyPrefix).toHaveLength(10);
  });

  it('keyHash equals sha256(fullKey) and matches hashApiKey', () => {
    const { fullKey, keyHash } = generateApiKey();
    expect(keyHash).toBe(createHash('sha256').update(fullKey).digest('hex'));
    expect(keyHash).toBe(hashApiKey(fullKey));
  });

  it('hashApiKey is deterministic', () => {
    expect(hashApiKey('pk_abc')).toBe(hashApiKey('pk_abc'));
  });

  it('generates a unique key each call', () => {
    expect(generateApiKey().fullKey).not.toBe(generateApiKey().fullKey);
  });
});
