import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { configureApplication } from 'src/config/configure-application';

const EXTERNAL_ORIGIN = 'https://someone-portfolio.example.com';

describe('Public API CORS (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const nestApp =
      moduleFixture.createNestApplication<NestExpressApplication>();
    configureApplication(nestApp);
    app = nestApp;
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows any origin on a public route (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/public/portfolio')
      .set('Origin', EXTERNAL_ORIGIN);

    // 401 without a key is fine — the CORS header is set regardless.
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  it('answers the public preflight with 204 + open CORS + x-api-key allowed', async () => {
    const res = await request(app.getHttpServer())
      .options('/public/portfolio')
      .set('Origin', EXTERNAL_ORIGIN)
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'x-api-key');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('*');
    expect(res.headers['access-control-allow-methods']).toContain('GET');
    expect(res.headers['access-control-allow-headers']).toContain('x-api-key');
  });

  it('does NOT open non-public routes to an external origin', async () => {
    const res = await request(app.getHttpServer())
      .get('/projects')
      .set('Origin', EXTERNAL_ORIGIN);

    // Unauthenticated → 401; and no wildcard CORS for the external origin.
    expect(res.headers['access-control-allow-origin']).not.toBe('*');
  });
});
