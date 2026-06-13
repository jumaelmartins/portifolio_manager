import { validate } from 'class-validator';
import { ResendVerificationDto } from './resend-verification.dto';
import { VerifyEmailDto } from './verify-email.dto';

describe('authentication DTO validation', () => {
  it('requires a 64-character token and six numeric code digits', async () => {
    const dto = Object.assign(new VerifyEmailDto(), {
      token: 'short',
      code: '12ab',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['token', 'code']),
    );
  });

  it('accepts a valid verification payload', async () => {
    const dto = Object.assign(new VerifyEmailDto(), {
      token: 'a'.repeat(64),
      code: '123456',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('requires a valid resend email address', async () => {
    const dto = Object.assign(new ResendVerificationDto(), {
      email: 'not-an-email',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('email');
  });
});
