import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email to send the password-reset link to',
    example: 'johndoe@email.com',
  })
  @IsEmail()
  email: string;
}
