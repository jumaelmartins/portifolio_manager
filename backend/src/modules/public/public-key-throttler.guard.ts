import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { hashApiKey } from '../api-keys/api-keys.util';

/**
 * Rate-limits public consumption per API key rather than per IP. A keyed
 * request is tracked by its hash; a keyless request falls back to IP (it is
 * rejected 401 by ApiKeyGuard anyway, but IP throttling caps the cost of an
 * invalid-key flood before the DB lookup).
 */
@Injectable()
export class PublicKeyThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const header = req.headers?.['x-api-key'];
    const presented = Array.isArray(header) ? header[0] : header;
    return presented ? `k:${hashApiKey(presented)}` : `ip:${req.ip}`;
  }
}
