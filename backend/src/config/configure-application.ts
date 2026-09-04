import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'node:path';
import {
  parseAllowedOrigins,
  setUploadSecurityHeaders,
} from './application.config';
import { publicCors } from './public-cors.middleware';

export function buildSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Portfolio Manager API')
    .setDescription(
      [
        'REST API for the Portfolio Manager CMS: manage projects and portfolio',
        'content, and expose a read-only public feed to any external site.',
        '',
        '## Authentication',
        '',
        '- **Admin endpoints** (Auth, Projects, API Keys) use a **JWT** issued',
        '  at `POST /auth/login`. Send it as `Authorization: Bearer <token>`.',
        '- **Public API** (`/public/*`) uses an **API key** minted from the',
        '  dashboard. Send it in the `x-api-key` header. Each key resolves to',
        "  its owner and returns that owner's active portfolio content.",
        '',
        '## Public API quick start',
        '',
        '```bash',
        'curl -H "x-api-key: <your key>" https://pm.jumadev.com/public/portfolio',
        '```',
      ].join('\n'),
    )
    .setVersion('1.0')
    .setContact('Portfolio Manager', 'https://pm.jumadev.com', '')
    .addServer('https://pm.jumadev.com', 'Production')
    .addServer('http://localhost:3000', 'Local development')
    .addTag(
      'Auth',
      'Registration, login, email verification and password flows',
    )
    .addTag('Projects', 'Manage the projects shown in your portfolio')
    .addTag('API Keys', 'Mint and revoke keys for the public API')
    .addTag('Public API', 'Read-only portfolio feed, authenticated by API key')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .build();
}

export function configureApplication(app: NestExpressApplication) {
  const configService = app.get(ConfigService);

  app.use(publicCors);

  app.enableCors({
    origin: parseAllowedOrigins(
      configService.get<string>(
        'CORS_ORIGINS',
        configService.get<string>('FRONTEND_URL', 'http://localhost:3001'),
      ),
    ),
    credentials: true,
  });

  const swaggerConfig = buildSwaggerConfig();
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
