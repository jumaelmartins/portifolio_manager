import { NotFoundException } from '@nestjs/common';
import { PublicService } from './public.service';

describe('PublicService', () => {
  const findUnique = jest.fn();
  const prisma = { f_user: { findUnique } };
  const config = { get: jest.fn().mockReturnValue('https://api.example.com') };
  let service: PublicService;

  const emptyPortfolio = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    f_profile_picture: null,
    f_projects: [],
    ...overrides,
  });

  beforeEach(() => {
    jest.resetAllMocks();
    config.get.mockReturnValue('https://api.example.com');
    service = new PublicService(prisma as never, config as never);
  });

  it('filters every content relation to active items only', async () => {
    findUnique.mockResolvedValue(emptyPortfolio());

    await service.getPortfolio(1);

    const arg = findUnique.mock.calls[0][0];
    const active = { archived_at: null, deleted_at: null };

    expect(arg.select.f_projects.where).toEqual(active);
    expect(arg.select.f_education.where).toEqual(active);
    expect(arg.select.f_courses.where).toEqual(active);
    expect(arg.select.f_experience.where).toEqual(active);
    expect(arg.select.custom_sections.where).toEqual(active);
    expect(arg.select.custom_sections.select.items.where).toEqual(active);
  });

  it('resolves project and profile-picture images to public absolute URLs', async () => {
    const image = (id: number, userId: number) => ({
      id,
      description: null,
      src_path: `uploads/${userId}/cover-${id}.png`,
      f_userId: userId,
      created_at: new Date('2026-01-01T00:00:00Z'),
      updated_at: new Date('2026-01-01T00:00:00Z'),
    });

    findUnique.mockResolvedValue(
      emptyPortfolio({
        f_profile_picture: { id: 5, f_images: image(9, 7) },
        f_projects: [
          { id: 1, title: 'A', f_images: image(11, 7) },
          { id: 2, title: 'B', f_images: null },
        ],
      }),
    );

    const result = await service.getPortfolio(7);

    expect(result.f_profile_picture?.f_images?.url).toBe(
      'https://api.example.com/uploads/7/cover-9.png',
    );
    expect(result.f_projects[0].f_images?.url).toBe(
      'https://api.example.com/uploads/7/cover-11.png',
    );
    expect(result.f_projects[1].f_images).toBeNull();

    // filesystem path never leaks to public consumers
    expect(result.f_projects[0].f_images).not.toHaveProperty('src_path');
    expect(result.f_profile_picture?.f_images).not.toHaveProperty('src_path');
  });

  it('throws when the user does not exist', async () => {
    findUnique.mockResolvedValue(null);

    await expect(service.getPortfolio(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
