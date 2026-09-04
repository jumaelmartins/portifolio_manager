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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../../utils/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@ApiTags('API Keys')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@UseGuards(JwtAuthGuard, ActiveUserGuard)
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @ApiOperation({
    summary: 'Create an API key',
    description:
      'Returns the plaintext key ONCE. Store it now — it cannot be retrieved later.',
  })
  @ApiCreatedResponse({
    description: 'The created key (plaintext shown only here)',
    schema: {
      example: {
        id: 1,
        label: 'personal site',
        key: 'pm_live_9c1f...redacted',
        key_prefix: 'pm_live_9c1f',
        created_at: '2026-08-01T00:00:00.000Z',
      },
    },
  })
  create(@Body() dto: CreateApiKeyDto, @Req() req: AuthenticatedRequest) {
    return this.apiKeysService.create(Number(req.user.sub), dto);
  }

  @Get()
  @ApiOperation({ summary: 'List your API keys (without the secret)' })
  @ApiOkResponse({
    description: 'The keys owned by the caller',
    schema: {
      example: [
        {
          id: 1,
          label: 'personal site',
          key_prefix: 'pm_live_9c1f',
          created_at: '2026-08-01T00:00:00.000Z',
          last_used_at: null,
          revoked_at: null,
        },
      ],
    },
  })
  list(@Req() req: AuthenticatedRequest) {
    return this.apiKeysService.list(Number(req.user.sub));
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiNoContentResponse({ description: 'The key was revoked' })
  async revoke(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.apiKeysService.revoke(Number(req.user.sub), id);
  }
}
