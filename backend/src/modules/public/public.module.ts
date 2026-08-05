import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, seconds } from '@nestjs/throttler';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';
import { PublicKeyThrottlerGuard } from './public-key-throttler.guard';
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
        const limit = Number(config.get<string>('PUBLIC_RATE_LIMIT'));
        return [
          {
            // ttl is milliseconds; env PUBLIC_RATE_TTL is seconds.
            ttl: seconds(
              Number.isFinite(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : 60,
            ),
            limit: Number.isFinite(limit) && limit > 0 ? limit : 60,
          },
        ];
      },
    }),
  ],
  controllers: [PublicController],
  providers: [PublicService, PublicKeyThrottlerGuard, ApiKeyGuard],
})
export class PublicModule {}
