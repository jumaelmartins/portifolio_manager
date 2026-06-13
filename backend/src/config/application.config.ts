export function parseAllowedOrigins(value?: string): string[] {
  return (value ?? 'http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
