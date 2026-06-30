import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateExperienceDto {
  @IsString()
  @IsNotEmpty()
  tile: string;

  @IsString()
  @IsNotEmpty()
  company_name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;

  @IsBoolean()
  @IsOptional()
  current?: boolean;
}
