import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateEducationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  institution_name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;

  @IsBoolean()
  @IsOptional()
  current?: boolean;
}
