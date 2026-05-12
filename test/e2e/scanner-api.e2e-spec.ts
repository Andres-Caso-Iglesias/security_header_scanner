import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/common/filters/http-exception.filter';

describe('Scanner API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/scan validation', () => {
    it('should return 400 for missing URL', () => {
      return request(app.getHttpServer()).post('/api/scan').send({}).expect(400);
    });

    it('should return 400 for invalid URL', () => {
      return request(app.getHttpServer()).post('/api/scan').send({ url: 'not-a-url' }).expect(400);
    });

    it('should return 400 for non-HTTP protocol', () => {
      return request(app.getHttpServer())
        .post('/api/scan')
        .send({ url: 'ftp://example.com' })
        .expect(400);
    });

    it('should reject extra fields in body', () => {
      return request(app.getHttpServer())
        .post('/api/scan')
        .send({ url: 'https://example.com', extraField: 'should not be allowed' })
        .expect(400);
    });
  });

  describe('POST /api/scan error handling', () => {
    it('should return 502 for unreachable URL', () => {
      return request(app.getHttpServer())
        .post('/api/scan')
        .send({ url: 'https://this-domain-does-not-exist-123456.com' })
        .expect(502);
    });
  });

  // Swagger UI and OpenAPI spec are served via main.ts bootstrap,
  // not through the module system, so they are tested at runtime.
});
