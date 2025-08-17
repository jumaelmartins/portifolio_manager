import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  username: string;
  @IsEmail()
  email: string;
  @IsNotEmpty()
  password_hash: string;
  role_id: number;
  status_id: number;
  auth_method_id: number;
  f_profile_pictureId: number;
  role: object;
  status: object;
  auth_method: object;
  online: number;
  last_login: Date
}
