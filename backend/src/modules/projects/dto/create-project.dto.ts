import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  repo_url?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  live_url?: string;

  @IsInt()
  d_categoryId: number;

  @IsOptional()
  @IsInt()
  f_imagesId?: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  technologyIds?: number[];
}
