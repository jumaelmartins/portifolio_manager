import { presentImage } from './image.presenter';
import { presentImageWithUsage } from './image.presenter';

describe('presentImage', () => {
  it('returns a public URL without leaking the filesystem path', () => {
    const result = presentImage(
      {
        id: 9,
        description: null,
        src_path: 'D:\\app\\uploads\\7\\cover.png',
        f_userId: 7,
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
      },
      'http://localhost:3000',
    );

    expect(result.url).toBe('http://localhost:3000/uploads/7/cover.png');
    expect(result).not.toHaveProperty('src_path');
    expect(result).not.toHaveProperty('f_userId');
  });
});

describe('presentImageWithUsage', () => {
  it('adds usage derived from project and profile-picture relations', () => {
    const image = {
      id: 5,
      description: 'cover',
      src_path: 'uploads/1/cover.png',
      f_userId: 1,
      created_at: new Date('2026-06-01T00:00:00.000Z'),
      updated_at: new Date('2026-06-01T00:00:00.000Z'),
      f_projects: [{ id: 2, title: 'Portfolio' }],
      f_profile_picture: { id: 9 },
    };

    const result = presentImageWithUsage(image as never, 'http://localhost:3000');

    expect(result.usage).toEqual({
      projects: [{ id: 2, title: 'Portfolio' }],
      isProfilePicture: true,
    });
    expect(result.url).toBe('http://localhost:3000/uploads/1/cover.png');
  });

  it('reports an unused image', () => {
    const image = {
      id: 6,
      description: null,
      src_path: 'uploads/1/x.png',
      f_userId: 1,
      created_at: new Date(),
      updated_at: new Date(),
      f_projects: [],
      f_profile_picture: null,
    };

    const result = presentImageWithUsage(image as never, 'http://localhost:3000');

    expect(result.usage).toEqual({ projects: [], isProfilePicture: false });
  });
});
