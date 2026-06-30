export function parseAllowedOrigins(value?: string): string[] {
  return (value ?? 'http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

type HeaderResponse = {
  setHeader(name: string, value: string): unknown;
};

export function setUploadSecurityHeaders(response: HeaderResponse): void {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
}
