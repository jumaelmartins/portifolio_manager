import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  HttpStatus,
  InternalServerErrorException,
  ConflictException,
  HttpCode,
  Put,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiResponse } from '@nestjs/swagger';
import { EmailVerificationService } from '../auth/email_verification_token.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private emailVerificationService: EmailVerificationService,
  ) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({})
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.usersService.create(createUserDto);

      await this.emailVerificationService.sendVerificationEmail(user.id);
      return {
        message:
          'Usuário criado com sucesso! Verifique seu email para ativar a conta.',
        user: {
          id: user.id,
          email: user.email,
          isEmailVerified: false,
          isActive: false,
        },
        instructions: {
          step1: 'Verifique sua caixa de email (incluindo spam)',
          step2: 'Clique no link do email ou acesse /auth/verify-email',
          step3: 'Digite o código de 6 dígitos enviado',
          note: 'O código expira em 30 minutos',
        },
      };
    } catch (e) {
      if (e.name === 'ConflictException') {
        throw new ConflictException(e.message);
      }
      throw new InternalServerErrorException();
    }
  }
  @Get()
  findAll() {
    return this.usersService.findAll();
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }
  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }
  @Patch(':id/inactivate')
  inactivate(@Param('id') id: string) {
    return this.usersService.update(+id, {
      status_id: 1,
    });
  }
}
