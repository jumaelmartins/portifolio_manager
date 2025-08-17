import { Injectable } from '@nestjs/common';
import { CreateAuthMethodDto } from './dto/create-auth_method.dto';
import { UpdateAuthMethodDto } from './dto/update-auth_method.dto';

@Injectable()
export class AuthMethodService {
  create(createAuthMethodDto: CreateAuthMethodDto) {
    return 'This action adds a new authMethod';
  }

  findAll() {
    return `This action returns all authMethod`;
  }

  findOne(id: number) {
    return `This action returns a #${id} authMethod`;
  }

  update(id: number, updateAuthMethodDto: UpdateAuthMethodDto) {
    return `This action updates a #${id} authMethod`;
  }

  remove(id: number) {
    return `This action removes a #${id} authMethod`;
  }
}
