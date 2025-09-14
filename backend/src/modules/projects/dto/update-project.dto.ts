import { PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  tile: string;
  description: string;
  repo_url?: string;
  live_url?: string;
  d_categoryId: number;
  f_imagesId?: number;
}
