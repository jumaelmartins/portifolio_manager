import { presentImage } from './image.presenter';

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
