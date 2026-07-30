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
 * Sets a shared-cache Cache-Control header on the SUCCESS path only.
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
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
      }),
    );
  }
}
