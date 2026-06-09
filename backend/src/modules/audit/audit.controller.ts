import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import type { AuthenticatedRequest } from '../../utils/types';

@UseGuards(JwtAuthGuard, ActiveUserGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  getAuditLog(
    @Req() req: AuthenticatedRequest,
    @Query('entity_type') entityType?: string,
    @Query('entity_id') entityId?: string,
  ) {
    return this.auditService.getAuditLog(
      Number(req.user.sub),
      Number(req.user.role),
      entityType,
      entityId ? Number(entityId) : undefined,
    );
  }

  @Get('me')
  getMyAuditLog(@Req() req: AuthenticatedRequest) {
    return this.auditService.getMyAuditLog(Number(req.user.sub));
  }
}
