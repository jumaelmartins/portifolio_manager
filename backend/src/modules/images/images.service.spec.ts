import { NotFoundException } from '@nestjs/common';
import { ImagesService } from './images.service';

describe('ImagesService', () => {
  const image = {
    id: 9,
    description: null,
    src_path: 'uploads/7/cover.png',
    f_userId: 7,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
  };
  const repository = {
    saveImage: jest.fn(),
    findById: jest.fn(),
    findByUser: jest.fn(),
    delete: jest.fn(),
  };
  const config = {
    get: jest.fn().mockReturnValue('http://localhost:3000'),
  };

  let service: ImagesService;

  beforeEach(() => {
    jest.resetAllMocks();
    config.get.mockReturnValue('http://localhost:3000');
    service = new ImagesService(repository as never, config as never);
  });

  it('returns only presented images owned by the user', async () => {
    repository.findByUser.mockResolvedValue([image]);

    await expect(service.findByUser(7)).resolves.toEqual([
      expect.objectContaining({
        id: 9,
        url: 'http://localhost:3000/uploads/7/cover.png',
      }),
    ]);

    const [presented] = await service.findByUser(7);
    expect(presented).not.toHaveProperty('src_path');
    expect(repository.findByUser).toHaveBeenCalledWith(7);
  });

  it('hides an image that is not owned by the requesting user', async () => {
    repository.findById.mockResolvedValue(image);

    await expect(service.findOwned(9, 8)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('keeps a raw lookup for internal authorization', async () => {
    repository.findById.mockResolvedValue(image);

    await expect(service.findEntity(9)).resolves.toBe(image);
  });
});
