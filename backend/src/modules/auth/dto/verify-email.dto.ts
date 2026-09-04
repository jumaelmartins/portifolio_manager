import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    description: '64-character verification token from the email link',
    example: 'a'.repeat(64),
    minLength: 64,
    maxLength: 64,
  })
  @IsString()
  @IsNotEmpty()
  @Length(64, 64)
  token: string;

  @ApiProperty({ description: '6-digit verification code', example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/)
  code: string;
}
