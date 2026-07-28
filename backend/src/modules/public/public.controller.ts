import { Controller, Get, Header, Param, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PublicService } from './public.service';

@Controller('public')
@UseGuards(ThrottlerGuard)
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('users/:userId')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=60')
  getPortfolio(@Param('userId') userId: string) {
    return this.publicService.getPortfolio(+userId);
  }
}
