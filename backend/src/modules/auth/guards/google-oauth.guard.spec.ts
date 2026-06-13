import { BadRequestException, type ExecutionContext } from '@nestjs/common';
import { GoogleOauthGuard } from './google-oauth.guard';

describe('GoogleOauthGuard', () => {
  it.each([undefined, '', '   '])(
    'rejects missing or blank initiation state: %p',
    (state) => {
      const guard = new GoogleOauthGuard();
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ query: { state } }),
        }),
      } as ExecutionContext;

      expect(() => guard.getAuthenticateOptions(context)).toThrow(
        new BadRequestException('Missing OAuth state'),
      );
    },
  );
});
