import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { configureApplication } from 'src/config/configure-application';
import { loginE2eUser } from './helpers/auth';

function userIdFromToken(token: string): number {
  const payload = JSON.parse(
    Buffer.from(token.split('.')[1], 'base64').toString('utf8'),
  );
  return Number(payload.sub);
}

const listIds = (body: Array<{ id: number }>) => body.map((r) => r.id);

describe('Soft-delete lifecycle (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let userId: number;
  let id: number;
  const title = `SoftDelete E2E ${Date.now()}`;

  const list = (state?: string) =>
    request(app.getHttpServer())
      .get(`/experience${state ? `?state=${state}` : ''}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

  const publicTitles = async () => {
    const res = await request(app.getHttpServer())
      .get(`/public/users/${userId}`)
      .expect(200);
    return (res.body.f_experience as Array<{ tile: string }>).map(
      (e) => e.tile,
    );
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const nestApp =
      moduleFixture.createNestApplication<NestExpressApplication>();
    configureApplication(nestApp);
    app = nestApp;
    await app.init();

    token = await loginE2eUser(app);
    userId = userIdFromToken(token);

    const created = await request(app.getHttpServer())
      .post('/experience')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tile: title,
        company_name: 'Acme',
        description: 'created by e2e',
        start_date: '2020-01-01',
      })
      .expect(201);
    id = created.body.id;
  });

  afterAll(async () => {
    // best-effort cleanup if the test aborted before purge
    await request(app.getHttpServer())
      .delete(`/experience/${id}/purge`)
      .set('Authorization', `Bearer ${token}`);
    await app.close();
  });

  it('new row is active and public', async () => {
    expect(listIds((await list()).body)).toContain(id);
    expect(await publicTitles()).toContain(title);
  });

  it('archive hides from active list and public, shows under archived', async () => {
    await request(app.getHttpServer())
      .patch(`/experience/${id}/archive`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listIds((await list()).body)).not.toContain(id);
    expect(listIds((await list('archived')).body)).toContain(id);
    expect(await publicTitles()).not.toContain(title);
  });

  it('unarchive returns it to active and public', async () => {
    await request(app.getHttpServer())
      .patch(`/experience/${id}/unarchive`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listIds((await list()).body)).toContain(id);
    expect(await publicTitles()).toContain(title);
  });

  it('delete trashes it (soft), hidden from active + public', async () => {
    await request(app.getHttpServer())
      .delete(`/experience/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listIds((await list()).body)).not.toContain(id);
    expect(listIds((await list('trash')).body)).toContain(id);
    expect(await publicTitles()).not.toContain(title);
  });

  it('restore returns it from trash to active', async () => {
    await request(app.getHttpServer())
      .patch(`/experience/${id}/restore`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listIds((await list()).body)).toContain(id);
    expect(listIds((await list('trash')).body)).not.toContain(id);
  });

  it('purge requires the row to be in trash', async () => {
    await request(app.getHttpServer())
      .delete(`/experience/${id}/purge`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('purge permanently removes a trashed row', async () => {
    await request(app.getHttpServer())
      .delete(`/experience/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/experience/${id}/purge`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listIds((await list('trash')).body)).not.toContain(id);
    expect(listIds((await list()).body)).not.toContain(id);
  });
});
