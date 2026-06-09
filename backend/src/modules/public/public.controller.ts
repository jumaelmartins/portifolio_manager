import { Controller, Get, Param } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('users/:userId')
  getPortfolio(@Param('userId') userId: string) {
    return this.publicService.getPortfolio(+userId);
  }
}
