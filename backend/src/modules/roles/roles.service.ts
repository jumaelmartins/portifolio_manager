import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesRepository } from './repository/roles.repository';
import { d_roles } from '@prisma/client';

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async create(createRoleDto: CreateRoleDto): Promise<d_roles | null> {
    const { role } = createRoleDto;
    const roleExist = await this.rolesRepository.findByRole(role);
    if (roleExist) {
      throw new ConflictException('Role already exists');
    }
    return await this.rolesRepository.create(createRoleDto);
  }

  async findAll() {
    return await this.rolesRepository.findAll();
  }

  async findOne(id: number): Promise<d_roles | null> {
    const role = await this.rolesRepository.findById(id);
    if (!role) {
      throw new NotFoundException(`Role wit not found`);
    }

    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<d_roles> {
    const role = await this.rolesRepository.findById(id);
    if (!role) {
      throw new NotFoundException(`Role wit not found`);
    }
    const updatedRole = await this.rolesRepository.update(id, updateRoleDto);

    return updatedRole;
  }

  async remove(id: number): Promise<void> {
    const role = await this.rolesRepository.findById(id);
    if (!role) {
      throw new NotFoundException(`Role wit not found`);
    }
    await this.rolesRepository.delete(id);
  }
}
