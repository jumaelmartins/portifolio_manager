import { buildMessage, ValidateBy, ValidationOptions } from 'class-validator';

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const WATCH_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
]);

/**
 * Returns the 11-character video id when `value` is a YouTube video URL, or
 * `null` otherwise. Accepts watch, youtu.be, shorts and embed forms over
 * http/https; rejects any other host, missing protocol or malformed id.
 */
export function extractYouTubeId(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return null;
  }

  const host = url.hostname.toLowerCase();

  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0];
    return VIDEO_ID.test(id) ? id : null;
  }

  if (WATCH_HOSTS.has(host)) {
    if (url.pathname === '/watch') {
      const id = url.searchParams.get('v') ?? '';
      return VIDEO_ID.test(id) ? id : null;
    }

    const segment = url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/);
    if (segment) {
      return VIDEO_ID.test(segment[1]) ? segment[1] : null;
    }
  }

  return null;
}

export function isYouTubeUrl(value: unknown): boolean {
  return extractYouTubeId(value) !== null;
}

export const IS_YOUTUBE_URL = 'isYouTubeUrl';

/**
 * class-validator decorator: property must be a YouTube video URL.
 */
export function IsYouTubeUrl(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: IS_YOUTUBE_URL,
      validator: {
        validate: (value): boolean => isYouTubeUrl(value),
        defaultMessage: buildMessage(
          (eachPrefix) => `${eachPrefix}$property must be a valid YouTube URL`,
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
