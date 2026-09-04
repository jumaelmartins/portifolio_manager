import { NotFoundException } from '@nestjs/common';
import { PublicService } from './public.service';

describe('PublicService', () => {
  const findUnique = jest.fn();
  const findMany = jest.fn();
  const prisma = {
    f_user: { findUnique },
    f_projects: { findMany },
  };
  let service: PublicService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new PublicService(prisma as never);
  });

  it('filters every content relation to active items only', async () => {
    findUnique.mockResolvedValue({ id: 1 });

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

  it('exposes the featured flag on each portfolio project', async () => {
    findUnique.mockResolvedValue({ id: 1 });

    await service.getPortfolio(1);

    const arg = findUnique.mock.calls[0][0];

    expect(arg.select.f_projects.select.featured).toBe(true);
  });

  describe('getFeaturedProjects', () => {
    it('returns only the active, featured projects owned by the caller', async () => {
      const featuredProjects = [{ id: 3, title: 'Highlight', featured: true }];
      findMany.mockResolvedValue(featuredProjects);

      const result = await service.getFeaturedProjects(1);

      expect(result).toBe(featuredProjects);

      const arg = findMany.mock.calls[0][0];
      expect(arg.where).toEqual({
        f_userId: 1,
        featured: true,
        archived_at: null,
        deleted_at: null,
      });
      expect(arg.orderBy).toEqual({ order: 'asc' });
      expect(arg.select.featured).toBe(true);
    });
  });

  it('throws when the user does not exist', async () => {
    findUnique.mockResolvedValue(null);

    await expect(service.getPortfolio(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
