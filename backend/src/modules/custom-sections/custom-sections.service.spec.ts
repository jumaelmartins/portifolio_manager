import { BadRequestException } from '@nestjs/common';
import { CustomSectionsService } from './custom-sections.service';

describe('CustomSectionsService', () => {
  const repository = {
    createSection: jest.fn(),
    findSectionsByUser: jest.fn(),
    findSectionById: jest.fn(),
    updateSection: jest.fn(),
    deleteSection: jest.fn(),
    createItem: jest.fn(),
    findItemById: jest.fn(),
    updateItem: jest.fn(),
    deleteItem: jest.fn(),
    findSectionIdsByUser: jest.fn(),
    reorderSections: jest.fn(),
    findItemIdsBySection: jest.fn(),
    reorderItems: jest.fn(),
  };

  let service: CustomSectionsService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new CustomSectionsService(repository as never);
  });

  describe('reorderSections', () => {
    it('persists the new order when the id set matches the owned sections', async () => {
      repository.findSectionIdsByUser.mockResolvedValue([1, 2, 3]);
      repository.findSectionsByUser.mockResolvedValue([
        { id: 3 },
        { id: 1 },
        { id: 2 },
      ]);

      const result = await service.reorderSections(42, [3, 1, 2]);

      expect(repository.findSectionIdsByUser).toHaveBeenCalledWith(42);
      expect(repository.reorderSections).toHaveBeenCalledWith([3, 1, 2]);
      expect(result).toEqual([{ id: 3 }, { id: 1 }, { id: 2 }]);
    });

    it('rejects an id set that does not match the owned sections', async () => {
      repository.findSectionIdsByUser.mockResolvedValue([1, 2, 3]);

      await expect(
        service.reorderSections(42, [1, 2, 999]),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.reorderSections).not.toHaveBeenCalled();
    });
  });
});
