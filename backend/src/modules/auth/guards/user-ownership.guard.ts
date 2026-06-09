import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRoles } from '../../../utils/types';

@Injectable()
export class UserOwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.sub;
    const paramId = req.params.id;

    if (
      (!userId || userId !== paramId) &&
      Number(req.user.role) !== UserRoles.SYSADMIN
    ) {
      throw new ForbiddenException(
        'You dont have permission to access this resource',
      );
    }
    return true;
  }
}
