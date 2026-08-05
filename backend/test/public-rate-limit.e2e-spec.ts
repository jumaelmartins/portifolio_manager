import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { configureApplication } from 'src/config/configure-application';
import { loginE2eUser } from './helpers/auth';

const EXTERNAL_ORIGIN = 'https://someone-portfolio.example.com';

describe('Public API hardening — rate limit (e2e)', () => {
  let app: INestApplication<App>;
  let apiKey: string;

  beforeAll(async () => {
    // Low, deterministic per-key limit for this spec only.
    process.env.PUBLIC_RATE_LIMIT = '3';
    process.env.PUBLIC_RATE_TTL = '60';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const nestApp =
      moduleFixture.createNestApplication<NestExpressApplication>();
    configureApplication(nestApp);
    app = nestApp;
    await app.init();

    const token = await loginE2eUser(app);
    const created = await request(app.getHttpServer())
      .post('/api-keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ label: 'rate-limit-e2e' })
      .expect(201);
    apiKey = created.body.key as string;
  });

  afterAll(async () => {
    delete process.env.PUBLIC_RATE_LIMIT;
    delete process.env.PUBLIC_RATE_TTL;
    await app.close();
  });

  it('allows up to the limit, then 429 with Retry-After and open CORS', async () => {
    const path = '/public/portfolio';

    for (let i = 0; i < 3; i += 1) {
      const ok = await request(app.getHttpServer())
        .get(path)
        .set('x-api-key', apiKey)
        .set('Origin', EXTERNAL_ORIGIN);
      expect(ok.status).not.toBe(429);
    }

    const blocked = await request(app.getHttpServer())
      .get(path)
      .set('x-api-key', apiKey)
      .set('Origin', EXTERNAL_ORIGIN);

    expect(blocked.status).toBe(429);
    expect(blocked.headers['retry-after']).toBeDefined();
    // publicCors runs before the guard → CORS header present even on 429.
    expect(blocked.headers['access-control-allow-origin']).toBe('*');
  });
});
