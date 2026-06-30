import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID', ''),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET', ''),
      callbackURL: configService.get<string>(
        'GOOGLE_CALLBACK_URL',
        'http://localhost:3000/auth/google/callback',
      ),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const { emails, displayName } = profile;
    const email = emails?.[0]?.value;

    if (!email)
      return done(new Error('No email from Google profile'), undefined);

    let user = await this.prismaService.f_user.findUnique({ where: { email } });

    if (!user) {
      user = await this.prismaService.f_user.create({
        data: {
          email,
          username:
            displayName?.toLowerCase().replace(/\s+/g, '_') ??
            email.split('@')[0],
          password_hash: '',
          auth_method_id: 2,
          status_id: 2,
          verified_email: true,
          email_verified_at: new Date(),
        },
      });
    }

    return done(null, user);
  }
}
