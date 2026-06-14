import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { ProjectRepository } from './projects.repository';

describe('ProjectRepository', () => {
  const projects = {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const images = {
    findUnique: jest.fn(),
  };
  const prisma = {
    f_projects: projects,
    f_images: images,
  };
  const include = {
    category: true,
    technologies: true,
    f_images: true,
  };

  let repository: ProjectRepository;

  beforeEach(() => {
    jest.resetAllMocks();
    repository = new ProjectRepository(prisma as never);
  });

  it('creates for the authenticated user and connects technologies', async () => {
    const dto = {
      title: 'Portfolio',
      description: 'Description',
      d_categoryId: 1,
      f_imagesId: 2,
      technologyIds: [3, 4],
    } as CreateProjectDto;

    await repository.create(dto, 42);

    expect(projects.create).toHaveBeenCalledWith({
      data: {
        title: dto.title,
        description: dto.description,
        d_categoryId: dto.d_categoryId,
        f_imagesId: dto.f_imagesId,
        f_userId: 42,
        technologies: {
          connect: [{ id: 3 }, { id: 4 }],
        },
      },
      include,
    });
  });

  it('allowlists create fields and always uses the authenticated user id', async () => {
    const payload = {
      title: 'Portfolio',
      description: 'Description',
      d_categoryId: 1,
      f_userId: 99,
      unexpected: 'must not reach Prisma',
    } as unknown as CreateProjectDto;

    await repository.create(payload, 42);

    expect(projects.create).toHaveBeenCalledWith({
      data: {
        title: payload.title,
        description: payload.description,
        d_categoryId: payload.d_categoryId,
        f_userId: 42,
      },
      include,
    });
  });

  it('scopes list and lookups to the authenticated user', async () => {
    await repository.findAll(42);
    await repository.findById(7, 42);
    await repository.findByTitle('Portfolio', 42);

    expect(projects.findMany).toHaveBeenCalledWith({
      where: { f_userId: 42 },
      include,
    });
    expect(projects.findFirst).toHaveBeenNthCalledWith(1, {
      where: { id: 7, f_userId: 42 },
      include,
    });
    expect(projects.findFirst).toHaveBeenNthCalledWith(2, {
      where: { title: 'Portfolio', f_userId: 42 },
      include,
    });
  });

  it('replaces technologies when an update provides technology ids', async () => {
    const dto = {
      description: 'Updated',
      technologyIds: [5, 6],
    } as UpdateProjectDto;

    await repository.update(7, 42, dto);

    expect(projects.update).toHaveBeenCalledWith({
      where: { id: 7, f_userId: 42 },
      data: {
        description: 'Updated',
        technologies: {
          set: [{ id: 5 }, { id: 6 }],
        },
      },
      include,
    });
  });

  it('does not change technologies when ids are omitted', async () => {
    const dto = { description: 'Updated' } as UpdateProjectDto;

    await repository.update(7, 42, dto);

    expect(projects.update).toHaveBeenCalledWith({
      where: { id: 7, f_userId: 42 },
      data: dto,
      include,
    });
  });

  it('disconnects all technologies when an empty list is provided', async () => {
    const dto = { technologyIds: [] } as UpdateProjectDto;

    await repository.update(7, 42, dto);

    expect(projects.update).toHaveBeenCalledWith({
      where: { id: 7, f_userId: 42 },
      data: {
        technologies: {
          set: [],
        },
      },
      include,
    });
  });

  it('allowlists update fields and never forwards an ownership override', async () => {
    const payload = {
      description: 'Updated',
      f_userId: 99,
      unexpected: 'must not reach Prisma',
    } as unknown as UpdateProjectDto;

    await repository.update(7, 42, payload);

    expect(projects.update).toHaveBeenCalledWith({
      where: { id: 7, f_userId: 42 },
      data: {
        description: 'Updated',
      },
      include,
    });
  });

  it('scopes deletion and can find an image by id', async () => {
    await repository.delete(7, 42);
    await repository.findImageById(9);

    expect(projects.delete).toHaveBeenCalledWith({
      where: { id: 7, f_userId: 42 },
    });
    expect(images.findUnique).toHaveBeenCalledWith({
      where: { id: 9 },
    });
  });
});
