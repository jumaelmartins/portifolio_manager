import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password-reset token from the email link',
    example: 'b'.repeat(64),
  })
  @IsString()
  token: string;

  @ApiProperty({
    description:
      'New password (min 8 chars, one uppercase, one number, one special)',
    example: 'yourStrongP@s5w0rd',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: 'password must contain an uppercase letter' })
  @Matches(/\d/, { message: 'password must contain a number' })
  @Matches(/[@$!%*?&]/, {
    message: 'password must contain a special character',
  })
  password: string;
}
