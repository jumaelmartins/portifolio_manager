import { extractYouTubeId, isYouTubeUrl } from './is-youtube-url';

describe('isYouTubeUrl', () => {
  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com/watch?v=dQw4w9WgXcQ',
    'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
    'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s',
    'https://youtu.be/dQw4w9WgXcQ?t=30',
  ])('accepts YouTube url %s', (url) => {
    expect(isYouTubeUrl(url)).toBe(true);
  });

  it.each([
    ['no protocol', 'www.youtube.com/watch?v=dQw4w9WgXcQ'],
    ['wrong host', 'https://vimeo.com/76979871'],
    ['lookalike host', 'https://youtube.evil.com/watch?v=dQw4w9WgXcQ'],
    ['missing video id', 'https://www.youtube.com/watch'],
    ['empty video id', 'https://www.youtube.com/watch?v='],
    ['channel page', 'https://www.youtube.com/@creator'],
    ['bare youtu.be', 'https://youtu.be/'],
    ['malformed id', 'https://youtu.be/short'],
    ['not a url', 'just a string'],
    ['empty string', ''],
  ])('rejects %s', (_label, url) => {
    expect(isYouTubeUrl(url)).toBe(false);
  });

  it.each([null, undefined, 42, {}])('rejects non-string %p', (value) => {
    expect(isYouTubeUrl(value as unknown as string)).toBe(false);
  });

  it('extracts the 11-char video id from every accepted form', () => {
    expect(
      extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    ).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ',
    );
    expect(extractYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ',
    );
    expect(extractYouTubeId('https://vimeo.com/76979871')).toBeNull();
  });
});
