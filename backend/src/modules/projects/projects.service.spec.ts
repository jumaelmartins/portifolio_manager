import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  const repository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByTitle: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findImageById: jest.fn(),
  };

  let service: ProjectsService;

  const createDto = (overrides: Partial<CreateProjectDto> = {}) =>
    ({
      title: 'Portfolio',
      description: 'Personal portfolio',
      d_categoryId: 1,
      ...overrides,
    }) as CreateProjectDto;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ProjectsService(repository as never);
  });

  it('scopes title lookup and creation to the authenticated user', async () => {
    const dto = createDto();
    const createdProject = { id: 1, ...dto, f_userId: 42 };
    repository.findByTitle.mockResolvedValue(null);
    repository.create.mockResolvedValue(createdProject);

    await expect(service.create(dto, 42)).resolves.toBe(createdProject);

    expect(repository.findByTitle).toHaveBeenCalledWith(dto.title, 42);
    expect(repository.create).toHaveBeenCalledWith(dto, 42);
  });

  it('forwards technology ids during creation', async () => {
    const dto = createDto({ technologyIds: [2, 5] });
    repository.findByTitle.mockResolvedValue(null);
    repository.create.mockResolvedValue({ id: 1 });

    await service.create(dto, 42);

    expect(repository.create).toHaveBeenCalledWith(dto, 42);
  });

  it('accepts a cover owned by the authenticated user', async () => {
    const dto = createDto({ f_imagesId: 9 });
    repository.findByTitle.mockResolvedValue(null);
    repository.findImageById.mockResolvedValue({ id: 9, f_userId: 42 });
    repository.create.mockResolvedValue({ id: 1 });

    await expect(service.create(dto, 42)).resolves.toEqual({ id: 1 });

    expect(repository.findImageById).toHaveBeenCalledWith(9);
  });

  it.each([
    ['another user', { id: 9, f_userId: 99 }],
    ['no user', null],
  ])('rejects a cover owned by %s', async (_case, image) => {
    const dto = createDto({ f_imagesId: 9 });
    repository.findByTitle.mockResolvedValue(null);
    repository.findImageById.mockResolvedValue(image);

    await expect(service.create(dto, 42)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it.each(['another user project', 'missing project'])(
    'returns NotFoundException when findOne cannot see %s',
    async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne(7, 42)).rejects.toEqual(
        new NotFoundException('Project Not Found'),
      );
      expect(repository.findById).toHaveBeenCalledWith(7, 42);
    },
  );

  it('rejects an update when the title belongs to another project of the same user', async () => {
    const dto = { title: 'Existing title' } as UpdateProjectDto;
    repository.findById.mockResolvedValue({ id: 7, f_userId: 42 });
    repository.findByTitle.mockResolvedValue({ id: 8, f_userId: 42 });

    await expect(service.update(7, dto, 42)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(repository.findByTitle).toHaveBeenCalledWith(dto.title, 42);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('allows an update when the title belongs to the project being updated', async () => {
    const dto = {
      title: 'Same project',
      technologyIds: [3, 4],
    } as UpdateProjectDto;
    repository.findById.mockResolvedValue({ id: 7, f_userId: 42 });
    repository.findByTitle.mockResolvedValue({ id: 7, f_userId: 42 });
    repository.update.mockResolvedValue({ id: 7, ...dto });

    await expect(service.update(7, dto, 42)).resolves.toEqual({
      id: 7,
      ...dto,
    });

    expect(repository.update).toHaveBeenCalledWith(7, 42, dto);
  });

  it('does not look up a title when an update leaves it unchanged', async () => {
    const dto = { description: 'Updated' } as UpdateProjectDto;
    repository.findById.mockResolvedValue({ id: 7, f_userId: 42 });
    repository.update.mockResolvedValue({ id: 7, ...dto });

    await service.update(7, dto, 42);

    expect(repository.findByTitle).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith(7, 42, dto);
  });

  it('validates cover ownership during update', async () => {
    const dto = { f_imagesId: 9 } as UpdateProjectDto;
    repository.findById.mockResolvedValue({ id: 7, f_userId: 42 });
    repository.findImageById.mockResolvedValue({ id: 9, f_userId: 99 });

    await expect(service.update(7, dto, 42)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });
});
