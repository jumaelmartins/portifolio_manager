import { hashApiKey } from '../api-keys/api-keys.util';

/**
 * Coarse per-IP tracker: caps total public traffic per client IP regardless of
 * whether a key is presented (valid or not). This is what bounds a rotating
 * invalid-key flood — and, because it caps the request rate, it also bounds how
 * many distinct per-key throttle entries a single IP can create per window.
 */
export function ipRateTracker(req: Record<string, any>): string {
  return `ip:${req.ip}`;
}

/**
 * Per-key tracker: keyed by the hashed API key when present, else the client IP.
 * Preserves per-key rate limits; the separate per-IP throttler bounds abuse from
 * keyless/invalid-key traffic.
 */
export function keyRateTracker(req: Record<string, any>): string {
  const header = req.headers?.['x-api-key'];
  const presented = Array.isArray(header) ? header[0] : header;
  return presented ? `k:${hashApiKey(presented)}` : `ip:${req.ip}`;
}
