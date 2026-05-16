"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helmet_1 = __importDefault(require("helmet"));
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const cors_config_1 = require("./common/config/cors.config");
const helmet_config_1 = require("./common/config/helmet.config");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        cors: cors_config_1.CORS_CONFIG,
    });
    app.use((0, helmet_1.default)(helmet_config_1.HELMET_CONFIG));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new http_exception_filter_1.AllExceptionsFilter());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Auditoría de Seguridad Web - API')
        .setDescription('Passive HTTP Security Header Scanner API. ' +
        'Analyzes HTTP response headers against OWASP Secure Headers Project standards, ' +
        'provides security scoring (A-F), and maps findings to OWASP Top 10 and NIS2 compliance frameworks.')
        .setVersion('1.0')
        .addTag('Scanner', 'Security header scanning operations')
        .addApiKey({ type: 'apiKey', in: 'header', name: 'X-API-Key', description: 'API key for authentication. Leave empty to disable.' }, 'X-API-Key')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    await app.listen(process.env.PORT ?? 3000);
    console.log(`Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
    console.log(`Swagger docs: http://localhost:${process.env.PORT ?? 3000}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map