import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
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

  @ValidateIf((_object, value) => value !== undefined)
  @IsUrl({ require_protocol: true })
  repo_url?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsUrl({ require_protocol: true })
  live_url?: string;

  @IsInt()
  d_categoryId: number;

  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  f_imagesId?: number;

  @ValidateIf((_object, value) => value !== undefined)
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  technologyIds?: number[];
}
