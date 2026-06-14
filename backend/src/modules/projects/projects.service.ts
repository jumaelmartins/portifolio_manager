import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectRepository } from './repository/projects.repository';

@Injectable()
export class ProjectsService {
  constructor(private projectRepository: ProjectRepository) {}

  async create(createProjectDto: CreateProjectDto, userId: number) {
    const { title } = createProjectDto;
    const project = await this.projectRepository.findByTitle(title, userId);
    if (project) {
      throw new ConflictException('Project Already Exists');
    }

    await this.validateCoverOwnership(createProjectDto.f_imagesId, userId);

    return this.projectRepository.create(createProjectDto, userId);
  }

  async findAll(userId: number) {
    return this.projectRepository.findAll(userId);
  }

  async findOne(id: number, userId: number) {
    const project = await this.projectRepository.findById(id, userId);
    if (!project) {
      throw new NotFoundException('Project Not Found');
    }

    return project;
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

    return this.projectRepository.update(id, userId, updateProjectDto);
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
}
