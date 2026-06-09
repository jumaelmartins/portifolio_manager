import { Module } from '@nestjs/common';
import { StatusService } from './status.service';
import { StatusController } from './status.controller';
import { StatusRepository } from './repository/status.repository';
import { StatusInMemoryRepository } from './repository/status-in-memor.repository';

@Module({
  controllers: [StatusController],
  providers: [StatusService, StatusRepository, StatusInMemoryRepository],
})
export class StatusModule {}
