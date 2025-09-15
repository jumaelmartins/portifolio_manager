import { Test, TestingModule } from '@nestjs/testing';
import { EducationService } from './education.service';
import { PrismaService } from 'src/database/prisma.service';
import { EducationRepository } from './repository/education.repository';

describe('EducationService', () => {
  let service: EducationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EducationService, EducationRepository, PrismaService],
    }).compile();

    service = module.get<EducationService>(EducationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
