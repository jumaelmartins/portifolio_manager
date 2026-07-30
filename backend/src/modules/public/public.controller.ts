import { Controller, Get, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PublicService } from './public.service';
import { PublicCacheInterceptor } from './public-cache.interceptor';

@Controller('public')
@UseGuards(ThrottlerGuard)
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('users/:userId')
  @UseInterceptors(PublicCacheInterceptor)
  getPortfolio(@Param('userId') userId: string) {
    return this.publicService.getPortfolio(+userId);
  }
}
