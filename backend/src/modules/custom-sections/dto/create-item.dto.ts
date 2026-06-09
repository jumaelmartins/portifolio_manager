import { IsObject, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateCustomItemDto {
  @IsObject()
  @IsNotEmpty()
  data: Record<string, any>;

  @IsNumber()
  @IsOptional()
  order?: number;
}
