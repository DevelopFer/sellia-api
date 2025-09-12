"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const config_1 = require("@nestjs/config");
const nestjs_zod_1 = require("nestjs-zod");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const prefix = configService.get('api.globalPrefix') || 'api';
    app.setGlobalPrefix(prefix);
    app.useGlobalPipes(new nestjs_zod_1.ZodValidationPipe());
    app.enableCors();
    const port = configService.get('port') || 3000;
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map