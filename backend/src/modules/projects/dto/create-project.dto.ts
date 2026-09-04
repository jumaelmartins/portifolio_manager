import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ description: 'Project title', example: 'Portfolio Manager' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @ApiProperty({
    description: 'Project description shown in the portfolio',
    example: 'A portfolio CMS built with NestJS and Next.js.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @ApiPropertyOptional({
    description: 'Public source-code repository URL',
    example: 'https://github.com/example/portfolio-manager',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsUrl({ require_protocol: true })
  repo_url?: string;

  @ApiPropertyOptional({
    description: 'Live/deployed project URL',
    example: 'https://pm.jumadev.com',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsUrl({ require_protocol: true })
  live_url?: string;

  @ApiProperty({ description: 'Category id (d_category)', example: 1 })
  @IsInt()
  d_categoryId: number;

  @ApiPropertyOptional({
    description: 'Cover image id owned by the caller (f_images)',
    example: 9,
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  f_imagesId?: number;

  @ApiPropertyOptional({
    description: 'Technology ids to associate (d_technologies)',
    example: [2, 5],
    type: [Number],
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  technologyIds?: number[];

  @ApiPropertyOptional({
    description: 'Whether the project is highlighted as featured',
    example: true,
    default: false,
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  featured?: boolean;
}
