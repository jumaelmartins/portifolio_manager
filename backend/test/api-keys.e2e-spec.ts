import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { configureApplication } from 'src/config/configure-application';
import { loginE2eUser } from './helpers/auth';

describe('API keys + keyed public consumption (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeAll(async () => {
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

    token = await loginE2eUser(app);
  });

  afterAll(async () => {
    delete process.env.PUBLIC_RATE_LIMIT;
    delete process.env.PUBLIC_RATE_TTL;
    delete process.env.PUBLIC_IP_RATE_LIMIT;
    await app.close();
  });

  it('mints a key (plaintext once), consumes the portfolio, lists then revokes', async () => {
    // Create
    const created = await request(app.getHttpServer())
      .post('/api-keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ label: 'my site' })
      .expect(201);

    expect(created.body.key).toMatch(/^pk_[0-9a-f]{48}$/);
    expect(created.body.key_prefix).toBe(created.body.key.slice(0, 10));
    expect(created.body).toHaveProperty('id');
    expect(created.body).toHaveProperty('label', 'my site');
    const apiKey = created.body.key as string;
    const keyId = created.body.id as number;

    // Consume with the key
    const portfolio = await request(app.getHttpServer())
      .get('/public/portfolio')
      .set('x-api-key', apiKey)
      .expect(200);
    expect(portfolio.body).toHaveProperty('f_projects');

    // List never exposes the hash or plaintext
    const list = await request(app.getHttpServer())
      .get('/api-keys')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const listed = (list.body as Array<Record<string, unknown>>).find(
      (k) => k.id === keyId,
    );
    expect(listed).toBeDefined();
    expect(listed).not.toHaveProperty('key_hash');
    expect(listed).not.toHaveProperty('key');

    // Revoke → 204; the key no longer works
    await request(app.getHttpServer())
      .delete(`/api-keys/${keyId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    await request(app.getHttpServer())
      .get('/public/portfolio')
      .set('x-api-key', apiKey)
      .expect(401);
  });

  it('rejects consumption with no key and with an unknown key', async () => {
    await request(app.getHttpServer()).get('/public/portfolio').expect(401);
    await request(app.getHttpServer())
      .get('/public/portfolio')
      .set('x-api-key', 'pk_deadbeef')
      .expect(401);
  });

  it('the old enumerable route is gone', async () => {
    await request(app.getHttpServer()).get('/public/users/1').expect(404);
  });

  it('requires a JWT to manage keys', async () => {
    await request(app.getHttpServer())
      .post('/api-keys')
      .send({ label: 'x' })
      .expect(401);
  });
});
