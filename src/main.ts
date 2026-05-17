import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { CORS_CONFIG } from './common/config/cors.config';
import { HELMET_CONFIG } from './common/config/helmet.config';
import { validateEnv } from './common/config/env.schema';

async function bootstrap() {
  const env = validateEnv();

  const app = await NestFactory.create(AppModule, {
    cors: CORS_CONFIG,
  });

  app.use(helmet(HELMET_CONFIG));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  app.getHttpAdapter().get('/', (_req: any, res: any) => {
    res.json({
      name: 'Security Header Scanner & Quick Assessment Tool API',
      version: '1.0',
      docs: '/api/docs',
      health: '/health',
    });
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Security Header Scanner - API')
    .setDescription(
      'Passive HTTP Security Header Scanner API. ' +
        'Analyzes HTTP response headers against OWASP Secure Headers Project standards, ' +
        'provides security scoring (A-F), and maps findings to OWASP Top 10 and NIS2 compliance frameworks.',
    )
    .setVersion('1.0')
    .addTag('Scanner', 'Security header scanning operations')
    .addApiKey(
      { type: 'apiKey', in: 'header', name: 'X-API-Key', description: 'API key for authentication. Leave empty to disable.' },
      'X-API-Key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(env.PORT);
  console.log(`Application is running on: http://localhost:${env.PORT}`);
  console.log(`Swagger docs: http://localhost:${env.PORT}/api/docs`);
}
bootstrap();
