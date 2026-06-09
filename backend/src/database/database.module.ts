import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuditContextService } from '../common/services/audit-context.service';

@Global()
@Module({
  providers: [PrismaService, AuditContextService],
  exports: [PrismaService, AuditContextService],
})
export class DatabaseModule {}
