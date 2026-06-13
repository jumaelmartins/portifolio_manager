import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { parseAllowedOrigins } from './config/application.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: parseAllowedOrigins(
      configService.get<string>(
        'CORS_ORIGINS',
        configService.get<string>('FRONTEND_URL', 'http://localhost:3001'),
      ),
    ),
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Portfolio Manager')
    .setDescription(
      'A simple CMS to manager your prjects and using in your persenal website',
    )
    .setVersion('1.0')
    .addTag('portfolio_manager')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, documentFactory);

  app.useGlobalPipes(
    new ValidationPipe({ transform: true, forbidUnknownValues: false }),
  );
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
