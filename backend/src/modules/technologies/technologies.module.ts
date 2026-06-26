import { Module } from '@nestjs/common';
import { TechnologiesService } from './technologies.service';
import { TechnologiesController } from './technologies.controller';
import { TechnologiesRepository } from './repository/technologies.repository';
@Module({
  controllers: [TechnologiesController],
  providers: [TechnologiesService, TechnologiesRepository],
})
export class TechnologiesModule {}
