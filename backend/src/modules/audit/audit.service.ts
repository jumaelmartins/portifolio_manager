import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { UserRoles } from '../../utils/types';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async getAuditLog(userId: number, role: number, entityType?: string, entityId?: number) {
    if (role !== UserRoles.SYSADMIN) {
      throw new ForbiddenException('Apenas administradores podem acessar os logs completos.');
    }

    return this.prisma.audit_log.findMany({
      where: {
        ...(entityType && { entity_type: entityType }),
        ...(entityId && { entity_id: entityId }),
      },
      orderBy: { created_at: 'desc' },
      include: {
        f_user: {
          select: { id: true, email: true, username: true },
        },
      },
      take: 100,
    });
  }

  async getMyAuditLog(userId: number) {
    return this.prisma.audit_log.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 100,
    });
  }
}
