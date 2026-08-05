import { Module } from '@nestjs/common';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysRepository } from './repository/api-keys.repository';

@Module({
  controllers: [ApiKeysController],
  providers: [ApiKeysService, ApiKeysRepository],
  exports: [ApiKeysRepository],
})
export class ApiKeysModule {}
