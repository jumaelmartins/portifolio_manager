import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuthMethodService } from './auth_method.service';
import { CreateAuthMethodDto } from './dto/create-auth_method.dto';
import { UpdateAuthMethodDto } from './dto/update-auth_method.dto';

@Controller('auth-method')
export class AuthMethodController {
  constructor(private readonly authMethodService: AuthMethodService) {}

  @Post()
  create(@Body() createAuthMethodDto: CreateAuthMethodDto) {
    return this.authMethodService.create(createAuthMethodDto);
  }

  @Get()
  findAll() {
    return this.authMethodService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authMethodService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuthMethodDto: UpdateAuthMethodDto) {
    return this.authMethodService.update(+id, updateAuthMethodDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authMethodService.remove(+id);
  }
}
