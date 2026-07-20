import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ExperienceService } from './experience.service';
import { UserRoles } from '../../utils/types';

describe('ExperienceService', () => {
  const repository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findIdsByUser: jest.fn(),
    reorder: jest.fn(),
    archive: jest.fn(),
    unarchive: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
  };

  let service: ExperienceService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ExperienceService(repository as never);
  });

  describe('reorder', () => {
    it('persists the new order when the id set matches the owned rows', async () => {
      repository.findIdsByUser.mockResolvedValue([1, 2, 3]);
      repository.findAll.mockResolvedValue([{ id: 3 }, { id: 1 }, { id: 2 }]);

      const result = await service.reorder(42, [3, 1, 2]);

      expect(repository.findIdsByUser).toHaveBeenCalledWith(42);
      expect(repository.reorder).toHaveBeenCalledWith([3, 1, 2]);
      expect(result).toEqual([{ id: 3 }, { id: 1 }, { id: 2 }]);
    });

    it('rejects an id set that does not match the owned rows', async () => {
      repository.findIdsByUser.mockResolvedValue([1, 2, 3]);

      await expect(service.reorder(42, [1, 2, 999])).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repository.reorder).not.toHaveBeenCalled();
    });
  });

  describe('soft-delete transitions', () => {
    const OWNER = 42;
    const owned = { id: 7, f_userId: OWNER, deleted_at: null };

    it('archives a row the user owns', async () => {
      repository.findById.mockResolvedValue(owned);

      await service.archive(7, OWNER, UserRoles.REGULAR);

      expect(repository.archive).toHaveBeenCalledWith(7);
    });

    it('remove now trashes (soft) instead of hard-deleting', async () => {
      repository.findById.mockResolvedValue(owned);

      await service.remove(7, OWNER, UserRoles.REGULAR);

      expect(repository.softDelete).toHaveBeenCalledWith(7);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('forbids a transition on another user row', async () => {
      repository.findById.mockResolvedValue({
        id: 7,
        f_userId: 99,
        deleted_at: null,
      });

      await expect(
        service.archive(7, OWNER, UserRoles.REGULAR),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('purges only a trashed row', async () => {
      repository.findById.mockResolvedValue({ ...owned, deleted_at: null });

      await expect(
        service.purge(7, OWNER, UserRoles.REGULAR),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('purges a trashed row with a hard delete', async () => {
      repository.findById.mockResolvedValue({
        ...owned,
        deleted_at: new Date(),
      });

      await service.purge(7, OWNER, UserRoles.REGULAR);

      expect(repository.delete).toHaveBeenCalledWith(7);
    });

    it('reads the requested state', async () => {
      repository.findAll.mockResolvedValue([]);

      await service.findAll(OWNER, UserRoles.REGULAR, 'trash');

      expect(repository.findAll).toHaveBeenCalledWith(OWNER, 'trash');
    });
  });
});
