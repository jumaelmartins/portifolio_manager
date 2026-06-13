import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  @Length(64, 64)
  token: string;

  @IsString()
  @Matches(/^\d{6}$/)
  code: string;
}
