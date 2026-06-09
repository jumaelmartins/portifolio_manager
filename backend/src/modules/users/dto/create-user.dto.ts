import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  username?: string;
  @IsEmail()
  @ApiProperty({
    description: 'user email',
    required: true,
    example: 'johndoe@email.com',
  })
  email: string;
  @IsNotEmpty()
  @IsString()
  @MinLength(8, {
    message: 'Password must be at least 8 characters long',
  })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
    message:
      'Password must contain at least one uppercase letter, one number, and one special character',
  })
  @ApiProperty({
    description: 'user password',
    required: true,
    example: 'yourStrongP@s5w0rd',
  })
  password: string;
}
