import { Module } from '@nestjs/common';
import { EducationService } from './education.service';
import { EducationController } from './education.controller';
import { PrismaService } from 'src/database/prisma.service';
import { EducationRepository } from './repository/education.repository';

@Module({
  controllers: [EducationController],
  providers: [EducationService,EducationRepository, PrismaService],
})
export class EducationModule {}
