import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { configureApplication } from 'src/config/configure-application';

describe('Public API hardening — per-IP flood cap (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    // Low IP ceiling, high per-key limit: isolate the IP layer.
    process.env.PUBLIC_IP_RATE_LIMIT = '3';
    process.env.PUBLIC_RATE_LIMIT = '1000';
    process.env.PUBLIC_RATE_TTL = '60';

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
    delete process.env.PUBLIC_IP_RATE_LIMIT;
    delete process.env.PUBLIC_RATE_LIMIT;
    delete process.env.PUBLIC_RATE_TTL;
    await app.close();
  });

  it('caps a rotating distinct-invalid-key flood from one IP (429, not endless 401)', async () => {
    // Each request presents a DIFFERENT invalid key, so the per-key throttler
    // never trips — only the per-IP throttler can stop this. Throttle runs
    // before auth, so the cap yields 429 rather than 401 once exceeded.
    for (let i = 0; i < 3; i += 1) {
      const res = await request(app.getHttpServer())
        .get('/public/portfolio')
        .set('x-api-key', `pk_invalid_${i}`);
      expect(res.status).not.toBe(429);
    }

    const blocked = await request(app.getHttpServer())
      .get('/public/portfolio')
      .set('x-api-key', 'pk_invalid_final');

    expect(blocked.status).toBe(429);
  });
});
