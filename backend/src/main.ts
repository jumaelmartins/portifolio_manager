import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { configureApplication } from './config/configure-application';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApplication(app);
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
