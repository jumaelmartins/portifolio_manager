import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  email?: string;
  username?: string;
  role_id?: number;
  status_id?: number;
  auth_method_id?: number;
  f_profile_pictureId?: number;
}
