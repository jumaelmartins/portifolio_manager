import { ParseIntPipe } from '@nestjs/common';
import { GUARDS_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CategoryController } from '../category/category.controller';
import { TechnologiesController } from '../technologies/technologies.controller';
import type { AuthenticatedRequest } from '../../utils/types';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsController } from './projects.controller';

describe('Controller ownership guards', () => {
  const projectService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const request = {
    user: {
      sub: '42',
      role: '2',
      status: '2',
    },
  } as AuthenticatedRequest;

  let controller: ProjectsController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new ProjectsController(projectService as never);
  });

  it.each([
    ['projects', ProjectsController],
    ['category', CategoryController],
    ['technologies', TechnologiesController],
  ])(
    'protects the %s controller with authentication and active-user guards',
    (_name, controllerClass) => {
      const guards = Reflect.getMetadata(
        GUARDS_METADATA,
        controllerClass,
      ) as unknown[];

      expect(guards).toEqual([JwtAuthGuard, ActiveUserGuard]);
    },
  );

  it('keeps only the admin method guard on technology deletion', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      TechnologiesController.prototype.remove,
    ) as unknown[];

    expect(guards).toEqual([AdminGuard]);
  });

  it('passes the authenticated user id through every project route', async () => {
    const createDto = { title: 'Portfolio' } as CreateProjectDto;
    const updateDto = { description: 'Updated' } as UpdateProjectDto;

    await controller.create(createDto, request);
    await controller.findAll(request);
    await controller.findOne(7, request);
    await controller.update(7, updateDto, request);
    await controller.delete(7, request);

    expect(projectService.create).toHaveBeenCalledWith(createDto, 42);
    expect(projectService.findAll).toHaveBeenCalledWith(42);
    expect(projectService.findOne).toHaveBeenCalledWith(7, 42);
    expect(projectService.update).toHaveBeenCalledWith(7, updateDto, 42);
    expect(projectService.delete).toHaveBeenCalledWith(7, 42);
  });

  it.each(['findOne', 'update', 'delete'] as const)(
    'parses the project id for %s',
    (methodName) => {
      const routeArguments = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        ProjectsController,
        methodName,
      ) as Record<string, { data?: string; pipes: unknown[] }>;
      const idArgument = Object.values(routeArguments).find(
        (argument) => argument.data === 'id',
      );

      expect(idArgument?.pipes).toEqual([ParseIntPipe]);
    },
  );
});
