import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Optional } from '@nestjs/common';

export enum UserRole {
  Admin = 1,
  User = 2,
}

export class CreateUserDto {
  username: string;
  @IsEmail()
  @ApiProperty({
    description: 'user email',
    required: true,
    example: 'johndoe@email.com',
  })
  email: string;
  @IsNotEmpty()
  @ApiProperty({
    description: 'user password',
    required: true,
    example: 'yourStrongP@s5w0rd',
  })
  password_hash: string;
}
