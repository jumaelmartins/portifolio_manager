import { ConflictException, Injectable } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectRepository } from './repository/projects.repository';

@Injectable()
export class ProjectsService {
  constructor(private projectRepository: ProjectRepository) {}

  async create(createProjectDto: CreateProjectDto) {
    const { title } = createProjectDto;
    const project = await this.projectRepository.findByTitle(title);
    if (project) {
      throw new ConflictException('Project Already Exists');
    }
    return await this.projectRepository.create(createProjectDto);
  }

  async findAll() {
    return await this.projectRepository.findAll();
  }

  async findOne(id: number) {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new ConflictException('Project Not Found');
    }

    return project;
  }

  async update(id: number, updateProjectDto: UpdateProjectDto) {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new ConflictException('Project Not Found');
    }

    return await this.projectRepository.update(id, updateProjectDto);
  }

  async delete(id: number) {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new ConflictException('Project Not Found');
    }
    
    return await this.projectRepository.delete(id);
  }
}
