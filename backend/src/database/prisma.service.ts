import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AuditContextService } from '../common/services/audit-context.service';
import { createAuditMiddleware } from './prisma-audit.middleware';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private auditContextService: AuditContextService) {
    super();
    this.$use(createAuditMiddleware(auditContextService));
  }

  async onModuleInit() {
    await this.$connect();
  }
}
