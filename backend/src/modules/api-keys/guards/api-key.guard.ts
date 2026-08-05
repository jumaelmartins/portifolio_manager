import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiKeysRepository } from '../repository/api-keys.repository';
import { hashApiKey } from '../api-keys.util';

const LAST_USED_DEBOUNCE_MS = 60_000;

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private apiKeysRepository: ApiKeysRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { apiKeyOwnerId?: number }>();

    const header = req.headers['x-api-key'];
    const presented = Array.isArray(header) ? header[0] : header;
    if (!presented) {
      throw new UnauthorizedException();
    }

    const key = await this.apiKeysRepository.findActiveByHash(
      hashApiKey(presented),
    );
    if (!key) {
      throw new UnauthorizedException();
    }

    req.apiKeyOwnerId = key.user_id;

    // Debounced, fire-and-forget: never block or fail the read on this write.
    const last = key.last_used_at ? key.last_used_at.getTime() : 0;
    if (Date.now() - last > LAST_USED_DEBOUNCE_MS) {
      void Promise.resolve(this.apiKeysRepository.touchLastUsed(key.id)).catch(
        () => undefined,
      );
    }

    return true;
  }
}
