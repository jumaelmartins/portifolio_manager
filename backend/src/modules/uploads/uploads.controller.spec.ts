import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { join } from 'path';
import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { canManageUploadTarget, UploadsController } from './uploads.controller';

describe('UploadsController', () => {
  const imagesService = {
    saveImage: jest.fn(),
    findEntity: jest.fn(),
    delete: jest.fn(),
  };

  let controller: UploadsController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new UploadsController(imagesService as never);
  });

  it('uses only authentication and active-user guards', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, UploadsController)).toEqual([
      JwtAuthGuard,
      ActiveUserGuard,
    ]);
  });

  it.each([
    [{ sub: '7', role: '2', status: '2' }, 7, true],
    [{ sub: '7', role: '2', status: '2' }, 8, false],
    [{ sub: '1', role: '1', status: '2' }, 8, true],
    [undefined, 7, false],
  ])(
    'authorizes the upload target before file processing',
    (user, userId, expected) => {
      expect(canManageUploadTarget(user, userId)).toBe(expected);
    },
  );

  it('allows a regular user to upload to their own account', async () => {
    imagesService.saveImage.mockResolvedValue({
      id: 3,
      url: 'http://localhost:3000/uploads/7/cover.png',
    });

    await expect(
      controller.uploadImage(
        7,
        {
          filename: 'cover.png',
          path: 'uploads/7/cover.png',
        } as Express.Multer.File,
        { user: { sub: '7', role: '2', status: '2' } } as never,
      ),
    ).resolves.toEqual({
      message: 'Successfully upload!',
      image: {
        id: 3,
        url: 'http://localhost:3000/uploads/7/cover.png',
      },
    });

    expect(imagesService.saveImage).toHaveBeenCalledWith({
      f_userId: 7,
      src_path: join('uploads', '7', 'cover.png'),
    });
  });

  it('rejects a regular user uploading to another account', async () => {
    await expect(
      controller.uploadImage(
        8,
        {
          filename: 'cover.png',
          path: 'uploads/8/cover.png',
        } as Express.Multer.File,
        { user: { sub: '7', role: '2', status: '2' } } as never,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows an administrator to upload to another account', async () => {
    imagesService.saveImage.mockResolvedValue({ id: 3 });

    await expect(
      controller.uploadImage(
        8,
        {
          filename: 'cover.png',
          path: 'uploads/8/cover.png',
        } as Express.Multer.File,
        { user: { sub: '1', role: '1', status: '2' } } as never,
      ),
    ).resolves.toBeDefined();
  });

  it('rejects an upload without a file', async () => {
    await expect(
      controller.uploadImage(
        7,
        undefined as never,
        { user: { sub: '7', role: '2', status: '2' } } as never,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('uses the raw image entity for delete authorization', async () => {
    imagesService.findEntity.mockResolvedValue({ id: 3, f_userId: 7 });
    imagesService.delete.mockResolvedValue({ message: 'deleted' });

    await controller.deleteImage(3, {
      user: { sub: '7', role: '2', status: '2' },
    } as never);

    expect(imagesService.findEntity).toHaveBeenCalledWith(3);
    expect(imagesService.delete).toHaveBeenCalledWith(3);
  });

  it('rejects a regular user deleting another account image', async () => {
    imagesService.findEntity.mockResolvedValue({ id: 3, f_userId: 8 });

    await expect(
      controller.deleteImage(3, {
        user: { sub: '7', role: '2', status: '2' },
      } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(imagesService.delete).not.toHaveBeenCalled();
  });

  it('allows an administrator to delete another account image', async () => {
    imagesService.findEntity.mockResolvedValue({ id: 3, f_userId: 8 });
    imagesService.delete.mockResolvedValue({ message: 'deleted' });

    await expect(
      controller.deleteImage(3, {
        user: { sub: '1', role: '1', status: '2' },
      } as never),
    ).resolves.toEqual({ message: 'deleted' });
  });
});
