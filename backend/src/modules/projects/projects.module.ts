import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { PrismaService } from 'src/database/prisma.service';
import { ProjectRepository } from './repository/projects.repository';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, PrismaService, ProjectRepository],
})
export class ProjectsModule {}
