import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { configureApplication } from 'src/config/configure-application';
import { loginE2eUser } from './helpers/auth';

describe('Content reorder (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('persists a new education order for the authenticated user', async () => {
    const before = await request(app.getHttpServer())
      .get('/education')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const ids: number[] = before.body.map((row: { id: number }) => row.id);
    expect(ids.length).toBeGreaterThan(1);

    const target = [...ids].reverse();

    await request(app.getHttpServer())
      .patch('/education/reorder')
      .set('Authorization', `Bearer ${token}`)
      .send({ ids: target })
      .expect(200);

    const after = await request(app.getHttpServer())
      .get('/education')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const orderedIds: number[] = after.body.map(
      (row: { id: number }) => row.id,
    );
    expect(orderedIds).toEqual(target);
  });

  it('rejects a reorder whose id set does not match the owned rows', async () => {
    const listing = await request(app.getHttpServer())
      .get('/education')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const ids: number[] = listing.body.map((row: { id: number }) => row.id);

    await request(app.getHttpServer())
      .patch('/education/reorder')
      .set('Authorization', `Bearer ${token}`)
      .send({ ids: [...ids, 999999] })
      .expect(400);
  });

  it('rejects unauthenticated reorder requests', async () => {
    await request(app.getHttpServer())
      .patch('/education/reorder')
      .send({ ids: [1, 2, 3] })
      .expect(401);

    await request(app.getHttpServer())
      .patch('/projects/reorder')
      .send({ ids: [1, 2, 3] })
      .expect(401);
  });
});
