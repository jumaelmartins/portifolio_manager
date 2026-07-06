import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export async function loginE2eUser(app: INestApplication): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'e2e@portfolio.test', password: 'E2eStrongP@ss1' })
    .expect(200);

  return response.body.access_token as string;
}
