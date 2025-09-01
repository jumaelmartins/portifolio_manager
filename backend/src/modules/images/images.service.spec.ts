import { Test, TestingModule } from '@nestjs/testing';
import { ImagesService } from './images.service';
import { ImagesRepository } from './repository/images.repository';
import { PrismaService } from '../../database/prisma.service';

describe('ImagesService', () => {
  let service: ImagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImagesService, ImagesRepository, PrismaService],
    }).compile();

    service = module.get<ImagesService>(ImagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
