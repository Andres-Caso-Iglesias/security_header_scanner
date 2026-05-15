import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('Auditoría de Seguridad Web - API')
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

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`Swagger docs: http://localhost:${process.env.PORT ?? 3000}/api/docs`);
}
bootstrap();
