import { validate } from 'class-validator';
import { CreateProjectDto } from './create-project.dto';
import { UpdateProjectDto } from './update-project.dto';

const validProject = {
  title: 'Portfolio',
  description: 'Personal portfolio',
  repo_url: 'https://github.com/example/portfolio',
  live_url: 'https://example.com',
  d_categoryId: 1,
  f_imagesId: 2,
  technologyIds: [3, 4],
};

const validateDto = (data: Record<string, unknown>) =>
  validate(Object.assign(new CreateProjectDto(), data));

const validateUpdateDto = (data: Record<string, unknown>) =>
  validate(Object.assign(new UpdateProjectDto(), data));

describe('CreateProjectDto', () => {
  it('accepts the complete valid payload without an owner field', async () => {
    await expect(validateDto(validProject)).resolves.toEqual([]);
    expect(new CreateProjectDto()).not.toHaveProperty('f_userId');
  });

  it.each([
    ['title', { ...validProject, title: '' }],
    ['title', { ...validProject, title: 'a'.repeat(121) }],
    ['description', { ...validProject, description: '' }],
    ['description', { ...validProject, description: 'a'.repeat(5001) }],
    ['repo_url', { ...validProject, repo_url: 'example.com/repository' }],
    ['live_url', { ...validProject, live_url: 'example.com' }],
    ['d_categoryId', { ...validProject, d_categoryId: 1.5 }],
    ['f_imagesId', { ...validProject, f_imagesId: 2.5 }],
    ['technologyIds', { ...validProject, technologyIds: [3, 3] }],
    ['technologyIds', { ...validProject, technologyIds: [3, '4'] }],
  ])('rejects invalid %s', async (property, payload) => {
    const errors = await validateDto(payload);

    expect(errors.map((error) => error.property)).toContain(property);
  });

  it('allows optional urls, cover and technologies to be omitted', async () => {
    await expect(
      validateDto({
        title: validProject.title,
        description: validProject.description,
        d_categoryId: validProject.d_categoryId,
      }),
    ).resolves.toEqual([]);
  });

  it.each(['technologyIds', 'f_imagesId'])(
    'rejects null for optional field %s',
    async (property) => {
      const errors = await validateDto({
        ...validProject,
        [property]: null,
      });

      expect(errors.map((error) => error.property)).toContain(property);
    },
  );
});

describe('UpdateProjectDto', () => {
  it('makes every create field optional', async () => {
    await expect(validate(new UpdateProjectDto())).resolves.toEqual([]);
  });

  it.each(['technologyIds', 'f_imagesId'])(
    'rejects null for optional field %s',
    async (property) => {
      const errors = await validateUpdateDto({ [property]: null });

      expect(errors.map((error) => error.property)).toContain(property);
    },
  );
});
