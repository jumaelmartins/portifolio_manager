import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { configureApplication } from 'src/config/configure-application';
import { loginE2eUser, userIdFromToken } from './helpers/auth';

describe('Public API hardening — caching (e2e)', () => {
  let app: INestApplication<App>;
  let userId: number;

  beforeAll(async () => {
    // High limit so cache assertions never trip the throttle.
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

    const token = await loginE2eUser(app);
    userId = userIdFromToken(token);
  });

  afterAll(async () => {
    delete process.env.PUBLIC_RATE_LIMIT;
    delete process.env.PUBLIC_RATE_TTL;
    await app.close();
  });

  it('sets a public Cache-Control header on the portfolio response', async () => {
    const res = await request(app.getHttpServer())
      .get(`/public/users/${userId}`)
      .expect(200);

    expect(res.headers['cache-control']).toBe(
      'public, max-age=60, s-maxage=60',
    );
    expect(res.headers['etag']).toBeDefined();
  });

  it('returns 304 for a conditional request with a matching ETag', async () => {
    const first = await request(app.getHttpServer())
      .get(`/public/users/${userId}`)
      .expect(200);

    const etag = first.headers['etag'] as string;

    const second = await request(app.getHttpServer())
      .get(`/public/users/${userId}`)
      .set('If-None-Match', etag);

    expect(second.status).toBe(304);
  });

  it('does NOT set Cache-Control on a 404 (error responses stay uncacheable)', async () => {
    const res = await request(app.getHttpServer())
      .get('/public/users/999999')
      .expect(404);

    expect(res.headers['cache-control']).toBeUndefined();
  });
});
