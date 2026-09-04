import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendVerificationDto {
  @ApiProperty({
    description: 'Email to resend the verification message to',
    example: 'johndoe@email.com',
  })
  @IsEmail()
  email: string;
}
