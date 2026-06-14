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
