import { PartialType } from '@nestjs/mapped-types';
import { CreateAuthMethodDto } from './create-auth_method.dto';

export class UpdateAuthMethodDto extends PartialType(CreateAuthMethodDto) {}
