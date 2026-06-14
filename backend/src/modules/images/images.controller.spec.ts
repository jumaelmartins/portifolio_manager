import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ImagesController } from './images.controller';

describe('ImagesController', () => {
  const service = {
    findByUser: jest.fn(),
    findOwned: jest.fn(),
  };
  const request = {
    user: { sub: '7', role: '2', status: '2' },
  } as never;

  let controller: ImagesController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new ImagesController(service as never);
  });

  it('protects all image routes', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, ImagesController)).toEqual([
      JwtAuthGuard,
      ActiveUserGuard,
    ]);
  });

  it('lists only the authenticated user images', async () => {
    await controller.findMine(request);
    expect(service.findByUser).toHaveBeenCalledWith(7);
  });

  it('loads an image only through the owned lookup', async () => {
    await controller.findOne(9, request);
    expect(service.findOwned).toHaveBeenCalledWith(9, 7);
  });
});
