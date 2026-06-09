import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsString, Min, MinLength } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsEmail()
  @ApiProperty({ required: false })
  email?: string;
  @IsString()
  @MinLength(6)
  @ApiProperty({ required: false })
  username?: string;
  @IsNumber()
  @ApiProperty({ required: false })
  role_id?: number;
  @IsNumber()
  @ApiProperty({ required: false })
  status_id?: number;
  @IsNumber()
  @ApiProperty({ required: false })
  f_profile_pictureId?: number;
}
