import { NotFoundException } from '@nestjs/common';
import { PublicService } from './public.service';

describe('PublicService', () => {
  const findUnique = jest.fn();
  const prisma = { f_user: { findUnique } };
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

  it('throws when the user does not exist', async () => {
    findUnique.mockResolvedValue(null);

    await expect(service.getPortfolio(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
