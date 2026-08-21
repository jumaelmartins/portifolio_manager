import { ConflictException, NotFoundException } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { ImagesService } from './images.service';

jest.mock('fs/promises');

describe('ImagesService', () => {
  const image = {
    id: 9,
    description: null,
    src_path: 'uploads/7/cover.png',
    f_userId: 7,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    f_projects: [],
    f_profile_picture: null,
  };
  const repository = {
    saveImage: jest.fn(),
    findById: jest.fn(),
    findByUser: jest.fn(),
    delete: jest.fn(),
    findWithUsage: jest.fn(),
    updateDescription: jest.fn(),
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

  it('presents each listed image with its usage', async () => {
    repository.findByUser.mockResolvedValue([
      {
        id: 5,
        description: null,
        src_path: 'uploads/1/a.png',
        f_userId: 1,
        created_at: new Date(),
        updated_at: new Date(),
        f_projects: [{ id: 2, title: 'Portfolio' }],
        f_profile_picture: null,
      },
    ]);

    const result = await service.findByUser(1);

    expect(result[0].usage).toEqual({
      projects: [{ id: 2, title: 'Portfolio' }],
      isProfilePicture: false,
    });
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

  describe('delete', () => {
    it('blocks deletion of an image used by a project', async () => {
      repository.findWithUsage.mockResolvedValue({
        id: 5,
        src_path: 'uploads/1/a.png',
        f_userId: 1,
        f_projects: [{ id: 2, title: 'Portfolio' }],
        f_profile_picture: null,
      });

      await expect(service.delete(5)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('blocks deletion of the profile picture', async () => {
      repository.findWithUsage.mockResolvedValue({
        id: 5,
        src_path: 'uploads/1/a.png',
        f_userId: 1,
        f_projects: [],
        f_profile_picture: { id: 9 },
      });

      await expect(service.delete(5)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('deletes the row before unlinking an unused image', async () => {
      const order: string[] = [];
      repository.findWithUsage.mockResolvedValue({
        id: 5,
        src_path: 'uploads/1/a.png',
        f_userId: 1,
        f_projects: [],
        f_profile_picture: null,
      });
      repository.delete.mockImplementation(async () => {
        order.push('db');
      });
      (unlink as jest.Mock).mockImplementation(async () => {
        order.push('unlink');
      });

      await service.delete(5);

      expect(order).toEqual(['db', 'unlink']);
    });
  });

  describe('updateDescription', () => {
    it('updates the description of an owned image', async () => {
      repository.findById.mockResolvedValue({
        id: 5,
        f_userId: 1,
        src_path: 'uploads/1/a.png',
        description: null,
        created_at: new Date(),
        updated_at: new Date(),
      });
      repository.updateDescription.mockResolvedValue({
        id: 5,
        f_userId: 1,
        src_path: 'uploads/1/a.png',
        description: 'New',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.updateDescription(5, 1, 'New');

      expect(repository.updateDescription).toHaveBeenCalledWith(5, 'New');
      expect(result.description).toBe('New');
    });

    it('rejects updating an image the user does not own', async () => {
      repository.findById.mockResolvedValue({
        id: 5,
        f_userId: 2,
        src_path: 'uploads/2/a.png',
        description: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await expect(
        service.updateDescription(5, 1, 'New'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.updateDescription).not.toHaveBeenCalled();
    });
  });
});
