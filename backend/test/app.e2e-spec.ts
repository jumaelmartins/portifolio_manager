import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { configureApplication } from 'src/config/configure-application';

describe('Application HTTP boundaries (e2e)', () => {
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

  it('serves the root endpoint', async () => {
    await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('rejects unauthenticated project listing', async () => {
    await request(app.getHttpServer()).get('/projects').expect(401);
  });

  it('rejects unauthenticated project deletion', async () => {
    await request(app.getHttpServer()).delete('/projects/1').expect(401);
  });

  it('serves Swagger documentation', async () => {
    await request(app.getHttpServer()).get('/api-docs').expect(200);
  });
});
