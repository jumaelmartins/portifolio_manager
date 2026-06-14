import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, type f_images } from '@prisma/client';
import { presentImage } from '../../common/presenters/image.presenter';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectRepository } from './repository/projects.repository';

@Injectable()
export class ProjectsService {
  constructor(
    private projectRepository: ProjectRepository,
    private configService: ConfigService,
  ) {}

  async create(createProjectDto: CreateProjectDto, userId: number) {
    const { title } = createProjectDto;
    const project = await this.projectRepository.findByTitle(title, userId);
    if (project) {
      throw new ConflictException('Project Already Exists');
    }

    await this.validateCoverOwnership(createProjectDto.f_imagesId, userId);

    const created = await this.executeProjectWrite(
      () => this.projectRepository.create(createProjectDto, userId),
      createProjectDto.technologyIds !== undefined,
    );
    return this.presentProject(created);
  }

  async findAll(userId: number) {
    const projects = await this.projectRepository.findAll(userId);
    return projects.map((project) => this.presentProject(project));
  }

  async findOne(id: number, userId: number) {
    const project = await this.projectRepository.findById(id, userId);
    if (!project) {
      throw new NotFoundException('Project Not Found');
    }

    return this.presentProject(project);
  }

  async update(id: number, updateProjectDto: UpdateProjectDto, userId: number) {
    const project = await this.projectRepository.findById(id, userId);
    if (!project) {
      throw new NotFoundException('Project Not Found');
    }

    if (updateProjectDto.title) {
      const projectWithTitle = await this.projectRepository.findByTitle(
        updateProjectDto.title,
        userId,
      );
      if (projectWithTitle && projectWithTitle.id !== id) {
        throw new ConflictException('Project Already Exists');
      }
    }

    await this.validateCoverOwnership(updateProjectDto.f_imagesId, userId);

    const updated = await this.executeProjectWrite(
      () => this.projectRepository.update(id, userId, updateProjectDto),
      updateProjectDto.technologyIds !== undefined,
    );
    return this.presentProject(updated);
  }

  async delete(id: number, userId: number) {
    const project = await this.projectRepository.findById(id, userId);
    if (!project) {
      throw new NotFoundException('Project Not Found');
    }

    return this.projectRepository.delete(id, userId);
  }

  private async validateCoverOwnership(
    imageId: number | undefined,
    userId: number,
  ) {
    if (imageId === undefined) {
      return;
    }

    const image = await this.projectRepository.findImageById(imageId);
    if (!image || image.f_userId !== userId) {
      throw new ForbiddenException('Project cover is not owned by user');
    }
  }

  private async executeProjectWrite<T>(
    write: () => Promise<T>,
    includesTechnologies: boolean,
  ): Promise<T> {
    try {
      return await write();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Project Already Exists');
        }

        if (error.code === 'P2025' && includesTechnologies) {
          throw new BadRequestException('Invalid project relationship');
        }
      }

      throw error;
    }
  }

  private presentProject<T extends { f_images?: f_images | null }>(project: T) {
    if (!Object.prototype.hasOwnProperty.call(project, 'f_images')) {
      return project;
    }

    return {
      ...project,
      f_images: project.f_images
        ? presentImage(
            project.f_images,
            this.configService.get<string>(
              'BACKEND_PUBLIC_URL',
              'http://localhost:3000',
            ),
          )
        : null,
    };
  }
}
