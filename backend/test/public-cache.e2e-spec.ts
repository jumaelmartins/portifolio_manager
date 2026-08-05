import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { configureApplication } from 'src/config/configure-application';
import { loginE2eUser } from './helpers/auth';

describe('Public API hardening — caching (e2e)', () => {
  let app: INestApplication<App>;
  let apiKey: string;

  beforeAll(async () => {
    // High limit so cache assertions never trip the throttle.
    process.env.PUBLIC_RATE_LIMIT = '1000';
    process.env.PUBLIC_RATE_TTL = '60';
    process.env.PUBLIC_IP_RATE_LIMIT = '1000';

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
      .send({ label: 'cache-e2e' })
      .expect(201);
    apiKey = created.body.key as string;
  });

  afterAll(async () => {
    delete process.env.PUBLIC_RATE_LIMIT;
    delete process.env.PUBLIC_RATE_TTL;
    delete process.env.PUBLIC_IP_RATE_LIMIT;
    await app.close();
  });

  it('sets a private Cache-Control header on the portfolio response', async () => {
    const res = await request(app.getHttpServer())
      .get('/public/portfolio')
      .set('x-api-key', apiKey)
      .expect(200);

    expect(res.headers['cache-control']).toBe('private, max-age=60');
    expect(res.headers['etag']).toBeDefined();
  });

  it('returns 304 for a conditional request with a matching ETag', async () => {
    const first = await request(app.getHttpServer())
      .get('/public/portfolio')
      .set('x-api-key', apiKey)
      .expect(200);

    const etag = first.headers['etag'];

    const second = await request(app.getHttpServer())
      .get('/public/portfolio')
      .set('x-api-key', apiKey)
      .set('If-None-Match', etag);

    expect(second.status).toBe(304);
  });

  it('does NOT set Cache-Control when unauthenticated (401 stays uncacheable)', async () => {
    const res = await request(app.getHttpServer())
      .get('/public/portfolio')
      .expect(401);

    expect(res.headers['cache-control']).toBeUndefined();
  });
});
