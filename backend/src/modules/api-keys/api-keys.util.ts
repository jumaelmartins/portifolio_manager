import { createHash, randomBytes } from 'node:crypto';

/** Lowercase sha256 hex digest of the full key. */
export function hashApiKey(fullKey: string): string {
  return createHash('sha256').update(fullKey).digest('hex');
}

/**
 * Mint a new public API key. The full plaintext is returned once and never
 * persisted; only the prefix (for display) and the sha256 hash are stored.
 */
export function generateApiKey(): {
  fullKey: string;
  keyPrefix: string;
  keyHash: string;
} {
  const fullKey = `pk_${randomBytes(24).toString('hex')}`;
  return {
    fullKey,
    keyPrefix: fullKey.slice(0, 10),
    keyHash: hashApiKey(fullKey),
  };
}
