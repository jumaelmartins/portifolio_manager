import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @ApiResponse({
    
  })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
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
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.inactivate(+id);
  }
}
