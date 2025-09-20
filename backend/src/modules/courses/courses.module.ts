import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { PrismaService } from 'src/database/prisma.service';
import { CoursesRepository } from './repository/courses.repository';

@Module({
  controllers: [CoursesController],
  providers: [CoursesService, CoursesRepository, PrismaService],
})
export class CoursesModule {}
