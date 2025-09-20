import { Module } from '@nestjs/common';
import { TechnologiesService } from './technologies.service';
import { TechnologiesController } from './technologies.controller';
import { TechnologiesRepository } from './repository/technologies.repository';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  controllers: [TechnologiesController],
  providers: [TechnologiesService, TechnologiesRepository, PrismaService],
})
export class TechnologiesModule {}
