import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ZodValidationPipe } from 'nestjs-zod';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // Global prefix
  const prefix = configService.get<string>('api.globalPrefix') || 'api';
  app.setGlobalPrefix(prefix);
  
  // Enable Zod validation pipes
  app.useGlobalPipes(new ZodValidationPipe());
  
  // Enable CORS
  app.enableCors();
  
  // Use Socket.IO adapter
  app.useWebSocketAdapter(new IoAdapter(app));
  
  const port = configService.get<number>('port') || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
