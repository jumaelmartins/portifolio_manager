import {
  BadRequestException,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { isValidOauthState } from '../oauth-handoff';

@Injectable()
export class GoogleOauthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<{ query?: { state?: unknown } }>();
    const state = request.query?.state;

    if (!isValidOauthState(state)) {
      throw new BadRequestException('Missing OAuth state');
    }

    return { state };
  }
}
