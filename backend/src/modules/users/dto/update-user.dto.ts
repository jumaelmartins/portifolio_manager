import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ description: 'role of user', example: 1 })
  role_id: number;
  status_id: number;
  auth_method_id: number;
  f_profile_pictureId: number;
}
