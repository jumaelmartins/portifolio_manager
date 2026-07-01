import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateUserDto } from './update-user.dto';

describe('UpdateUserDto validation', () => {
  it('accepts a partial profile-save body with email and username', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      email: 'john@doe.com',
      username: 'jumael',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('accepts a partial upload body with only f_profile_pictureId', async () => {
    const dto = plainToInstance(UpdateUserDto, { f_profile_pictureId: 5 });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('accepts an empty body', async () => {
    const dto = plainToInstance(UpdateUserDto, {});

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects an invalid email', async () => {
    const dto = plainToInstance(UpdateUserDto, { email: 'not-an-email' });

    const errors = await validate(dto);

    expect(errors.map((e) => e.property)).toContain('email');
  });

  it('rejects a username shorter than 6 characters', async () => {
    const dto = plainToInstance(UpdateUserDto, { username: 'abc' });

    const errors = await validate(dto);

    const usernameError = errors.find((e) => e.property === 'username');
    expect(usernameError).toBeDefined();
    expect(Object.keys(usernameError!.constraints ?? {})).toContain('minLength');
  });
});
