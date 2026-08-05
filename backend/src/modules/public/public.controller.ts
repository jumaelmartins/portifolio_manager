import {
  Controller,
  Get,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import type { Request } from 'express';
import { PublicService } from './public.service';
import { PublicCacheInterceptor } from './public-cache.interceptor';
import { PublicKeyThrottlerGuard } from './public-key-throttler.guard';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';

@ApiSecurity('x-api-key')
@Controller('public')
@UseGuards(PublicKeyThrottlerGuard, ApiKeyGuard)
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('portfolio')
  @UseInterceptors(PublicCacheInterceptor)
  getPortfolio(@Req() req: Request & { apiKeyOwnerId: number }) {
    return this.publicService.getPortfolio(req.apiKeyOwnerId);
  }
}
