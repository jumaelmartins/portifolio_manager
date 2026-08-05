import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Sets a private (browser-only) Cache-Control header on the SUCCESS path only.
 * Using an interceptor (rather than @Header) means the header is applied
 * when the handler emits a value; on a thrown error the tap never runs,
 * so 404/5xx responses stay uncacheable.
 */
@Injectable()
export class PublicCacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse<Response>();
        // Per-owner data (owner derived from the key) must NOT be shared-cached.
        res.setHeader('Cache-Control', 'private, max-age=60');
      }),
    );
  }
}
