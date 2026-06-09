import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserStatus } from '../../../utils/types';

@Injectable()
export class ActiveUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const { status } = req.user;
    if (Number(status) !== UserStatus.ACTIVE) {
      throw new ForbiddenException(
        'Only Active users can access this resource.',
      );
    }
    return true;
  }
}
