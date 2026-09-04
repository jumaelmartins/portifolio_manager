import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({ description: 'Account email', example: 'johndoe@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Account password',
    example: 'yourStrongP@s5w0rd',
  })
  @IsNotEmpty()
  password: string;
}
