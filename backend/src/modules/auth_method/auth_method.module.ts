import { Module } from '@nestjs/common';
import { AuthMethodService } from './auth_method.service';
import { AuthMethodController } from './auth_method.controller';

@Module({
  controllers: [AuthMethodController],
  providers: [AuthMethodService],
})
export class AuthMethodModule {}
