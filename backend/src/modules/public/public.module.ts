import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule, seconds } from '@nestjs/throttler';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';
import { ipRateTracker, keyRateTracker } from './public-throttlers';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [
    ApiKeysModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const ttlSeconds = Number(config.get<string>('PUBLIC_RATE_TTL'));
        const keyLimit = Number(config.get<string>('PUBLIC_RATE_LIMIT'));
        const ipLimit = Number(config.get<string>('PUBLIC_IP_RATE_LIMIT'));
        const ttl = seconds(
          Number.isFinite(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : 60,
        );
        return [
          {
            name: 'ip',
            ttl,
            limit: Number.isFinite(ipLimit) && ipLimit > 0 ? ipLimit : 120,
            getTracker: ipRateTracker,
          },
          {
            // Deliberately unnamed (implicit 'default'): @nestjs/throttler
            // suffixes ALL rate-limit headers with `-${name}` for any
            // non-default-named throttler (see throttler.guard.js
            // `getThrottlerSuffix`). Naming this 'key' would silently drop
            // the standard `Retry-After`/`X-RateLimit-*` headers on a
            // per-key 429 (replaced by `Retry-After-key` etc.), breaking
            // the existing public-rate-limit.e2e-spec contract and any real
            // client that reads the standard header. Keeping this throttler
            // unnamed preserves that contract; the coarse IP layer (new,
            // additive) is the one that gets suffixed `-ip` headers.
            ttl,
            limit: Number.isFinite(keyLimit) && keyLimit > 0 ? keyLimit : 60,
            getTracker: keyRateTracker,
          },
        ];
      },
    }),
  ],
  controllers: [PublicController],
  providers: [PublicService, ThrottlerGuard, ApiKeyGuard],
})
export class PublicModule {}
