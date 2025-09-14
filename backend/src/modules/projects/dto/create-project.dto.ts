export class CreateProjectDto {
  title: string;
  description: string;
  repo_url?: string;
  live_url?: string;
  f_userId: number;
  d_categoryId: number;
  f_imagesId?: number;
}
