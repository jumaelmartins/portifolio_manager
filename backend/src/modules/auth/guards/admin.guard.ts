import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRoles } from '../../../utils/types';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const { role } = req.user;
    if (Number(role) !== UserRoles.SYSADMIN) {
      throw new ForbiddenException('Only ADMIN can access this resource');
    }
    return true;
  }
}
