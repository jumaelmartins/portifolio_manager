import { validate } from 'class-validator';
import { UpdateImageDto } from './update-image.dto';

const build = (data: Record<string, unknown>) =>
  validate(Object.assign(new UpdateImageDto(), data));

describe('UpdateImageDto', () => {
  it('accepts a description string', async () => {
    await expect(build({ description: 'My cover' })).resolves.toEqual([]);
  });

  it('accepts null to clear the description', async () => {
    await expect(build({ description: null })).resolves.toEqual([]);
  });

  it('accepts an omitted description', async () => {
    await expect(build({})).resolves.toEqual([]);
  });

  it('rejects a description over 200 chars', async () => {
    const errors = await build({ description: 'a'.repeat(201) });
    expect(errors.map((e) => e.property)).toContain('description');
  });

  it('rejects a non-string description', async () => {
    const errors = await build({ description: 42 });
    expect(errors.map((e) => e.property)).toContain('description');
  });
});
