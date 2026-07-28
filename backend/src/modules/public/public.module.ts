import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, seconds } from '@nestjs/throttler';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          // ttl is milliseconds; env PUBLIC_RATE_TTL is seconds.
          ttl: seconds(Number(config.get<string>('PUBLIC_RATE_TTL') ?? '60')),
          limit: Number(config.get<string>('PUBLIC_RATE_LIMIT') ?? '60'),
        },
      ],
    }),
  ],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
