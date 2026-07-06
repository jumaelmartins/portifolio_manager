import { BadRequestException } from '@nestjs/common';
import { CoursesService } from './courses.service';

describe('CoursesService', () => {
  const repository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findIdsByUser: jest.fn(),
    reorder: jest.fn(),
  };

  let service: CoursesService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new CoursesService(repository as never);
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
});
