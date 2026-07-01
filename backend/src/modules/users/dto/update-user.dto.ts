import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsEmail()
  @ApiProperty({ required: false })
  email?: string;
  @IsOptional()
  @IsString()
  @MinLength(6)
  @ApiProperty({ required: false })
  username?: string;
  @IsOptional()
  @IsNumber()
  @ApiProperty({ required: false })
  role_id?: number;
  @IsOptional()
  @IsNumber()
  @ApiProperty({ required: false })
  status_id?: number;
  @IsOptional()
  @IsNumber()
  @ApiProperty({ required: false })
  f_profile_pictureId?: number;
}
