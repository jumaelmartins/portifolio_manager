import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'node:path';
import {
  parseAllowedOrigins,
  setUploadSecurityHeaders,
} from './application.config';

export function configureApplication(app: NestExpressApplication) {
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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Portfolio Manager')
    .setDescription(
      'A simple CMS to manage projects and expose portfolio content.',
    )
    .setVersion('1.0')
    .addTag('portfolio_manager')
    .build();
  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, documentFactory);

  app.useGlobalPipes(
    new ValidationPipe({ transform: true, forbidUnknownValues: false }),
  );
  app.useStaticAssets(join(__dirname, '..', '..', 'public'));
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
    setHeaders: setUploadSecurityHeaders,
  });
  app.setBaseViewsDir(join(__dirname, '..', '..', 'views'));
  app.setViewEngine('hbs');
}
