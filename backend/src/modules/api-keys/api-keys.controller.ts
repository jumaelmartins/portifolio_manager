import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../../utils/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@UseGuards(JwtAuthGuard, ActiveUserGuard)
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  create(@Body() dto: CreateApiKeyDto, @Req() req: AuthenticatedRequest) {
    return this.apiKeysService.create(Number(req.user.sub), dto);
  }

  @Get()
  list(@Req() req: AuthenticatedRequest) {
    return this.apiKeysService.list(Number(req.user.sub));
  }

  @Delete(':id')
  @HttpCode(204)
  async revoke(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.apiKeysService.revoke(Number(req.user.sub), id);
  }
}
