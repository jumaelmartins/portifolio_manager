import { IsString, MaxLength, ValidateIf } from 'class-validator';

export class UpdateImageDto {
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(200)
  description?: string | null;
}
