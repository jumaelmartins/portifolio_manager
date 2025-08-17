import { Test, TestingModule } from '@nestjs/testing';
import { AuthMethodController } from './auth_method.controller';
import { AuthMethodService } from './auth_method.service';

describe('AuthMethodController', () => {
  let controller: AuthMethodController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthMethodController],
      providers: [AuthMethodService],
    }).compile();

    controller = module.get<AuthMethodController>(AuthMethodController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
