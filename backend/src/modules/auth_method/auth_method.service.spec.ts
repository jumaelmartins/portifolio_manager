import { Test, TestingModule } from '@nestjs/testing';
import { AuthMethodService } from './auth_method.service';

describe('AuthMethodService', () => {
  let service: AuthMethodService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthMethodService],
    }).compile();

    service = module.get<AuthMethodService>(AuthMethodService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
