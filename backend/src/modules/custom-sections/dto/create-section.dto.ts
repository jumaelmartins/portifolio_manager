import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CustomFieldSchemaDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsOptional()
  required?: boolean;
}

export class CreateCustomSectionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomFieldSchemaDto)
  field_schema: CustomFieldSchemaDto[];

  @IsNumber()
  @IsOptional()
  order?: number;
}
