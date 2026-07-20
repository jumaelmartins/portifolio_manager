import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CustomSectionsService } from './custom-sections.service';
import { UserRoles } from '../../utils/types';

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
    findItemsBySection: jest.fn(),
    archiveSection: jest.fn(),
    unarchiveSection: jest.fn(),
    softDeleteSection: jest.fn(),
    restoreSection: jest.fn(),
    archiveItem: jest.fn(),
    unarchiveItem: jest.fn(),
    softDeleteItem: jest.fn(),
    restoreItem: jest.fn(),
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

  describe('reorderItems', () => {
    it('rejects when the section belongs to another user', async () => {
      repository.findSectionById.mockResolvedValue({
        id: 5,
        user_id: 99,
        items: [],
      });

      await expect(
        service.reorderItems(5, [1, 2], 42, UserRoles.REGULAR),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.reorderItems).not.toHaveBeenCalled();
    });

    it('rejects an id set that does not match the section items', async () => {
      repository.findSectionById.mockResolvedValue({
        id: 5,
        user_id: 42,
        items: [],
      });
      repository.findItemIdsBySection.mockResolvedValue([1, 2, 3]);

      await expect(
        service.reorderItems(5, [1, 2, 999], 42, UserRoles.REGULAR),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.reorderItems).not.toHaveBeenCalled();
    });

    it('persists the new item order for the owning user', async () => {
      const reordered = {
        id: 5,
        user_id: 42,
        items: [{ id: 3 }, { id: 1 }, { id: 2 }],
      };
      repository.findSectionById
        .mockResolvedValueOnce({ id: 5, user_id: 42, items: [] })
        .mockResolvedValueOnce(reordered);
      repository.findItemIdsBySection.mockResolvedValue([1, 2, 3]);

      const result = await service.reorderItems(
        5,
        [3, 1, 2],
        42,
        UserRoles.REGULAR,
      );

      expect(repository.reorderItems).toHaveBeenCalledWith([3, 1, 2]);
      expect(result).toEqual(reordered);
    });
  });

  describe('section transitions', () => {
    it('archives a section the user owns', async () => {
      repository.findSectionById.mockResolvedValue({
        id: 5,
        user_id: 42,
        items: [],
      });

      await service.archiveSection(5, 42, UserRoles.REGULAR);

      expect(repository.archiveSection).toHaveBeenCalledWith(5);
    });

    it('deleteSection now trashes (soft)', async () => {
      repository.findSectionById.mockResolvedValue({
        id: 5,
        user_id: 42,
        items: [],
      });

      await service.deleteSection(5, 42, UserRoles.REGULAR);

      expect(repository.softDeleteSection).toHaveBeenCalledWith(5);
      expect(repository.deleteSection).not.toHaveBeenCalled();
    });

    it('forbids a transition on another user section', async () => {
      repository.findSectionById.mockResolvedValue({
        id: 5,
        user_id: 99,
        items: [],
      });

      await expect(
        service.archiveSection(5, 42, UserRoles.REGULAR),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('purges only a trashed section', async () => {
      repository.findSectionById.mockResolvedValue({
        id: 5,
        user_id: 42,
        items: [],
        deleted_at: null,
      });

      await expect(
        service.purgeSection(5, 42, UserRoles.REGULAR),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.deleteSection).not.toHaveBeenCalled();
    });
  });

  describe('item transitions', () => {
    const ownedItem = { id: 8, deleted_at: null, section: { user_id: 42 } };

    it('archives an item the user owns', async () => {
      repository.findItemById.mockResolvedValue(ownedItem);

      await service.archiveItem(8, 42, UserRoles.REGULAR);

      expect(repository.archiveItem).toHaveBeenCalledWith(8);
    });

    it('deleteItem now trashes (soft)', async () => {
      repository.findItemById.mockResolvedValue(ownedItem);

      await service.deleteItem(8, 42, UserRoles.REGULAR);

      expect(repository.softDeleteItem).toHaveBeenCalledWith(8);
      expect(repository.deleteItem).not.toHaveBeenCalled();
    });

    it('purges only a trashed item', async () => {
      repository.findItemById.mockResolvedValue(ownedItem);

      await expect(
        service.purgeItem(8, 42, UserRoles.REGULAR),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.deleteItem).not.toHaveBeenCalled();
    });

    it('lists items in a given state for the owner', async () => {
      repository.findSectionById.mockResolvedValue({
        id: 5,
        user_id: 42,
        items: [],
      });
      repository.findItemsBySection.mockResolvedValue([{ id: 8 }]);

      const result = await service.findSectionItems(
        5,
        42,
        UserRoles.REGULAR,
        'trash',
      );

      expect(repository.findItemsBySection).toHaveBeenCalledWith(5, 'trash');
      expect(result).toEqual([{ id: 8 }]);
    });
  });
});
