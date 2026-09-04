import { buildSwaggerConfig } from './configure-application';

describe('buildSwaggerConfig', () => {
  const config = buildSwaggerConfig();

  it('titles and versions the API', () => {
    expect(config.info.title).toBe('Portfolio Manager API');
    expect(config.info.version).toBe('1.0');
    expect(config.info.description).toContain('x-api-key');
  });

  it('advertises the production domain as a server, not localhost only', () => {
    const urls = (config.servers ?? []).map((server) => server.url);

    expect(urls).toContain('https://pm.jumadev.com');
    expect(urls).toContain('http://localhost:3000');
  });

  it('documents both the JWT and API-key security schemes', () => {
    const schemes = config.components?.securitySchemes ?? {};

    expect(schemes['access-token']).toEqual(
      expect.objectContaining({ type: 'http', scheme: 'bearer' }),
    );
    expect(schemes['x-api-key']).toEqual(
      expect.objectContaining({ type: 'apiKey', name: 'x-api-key' }),
    );
  });

  it('groups endpoints under consumer-facing tags', () => {
    const tagNames = (config.tags ?? []).map((tag) => tag.name);

    expect(tagNames).toEqual(
      expect.arrayContaining(['Auth', 'Projects', 'API Keys', 'Public API']),
    );
  });
});
