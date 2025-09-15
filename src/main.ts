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
  
  // Enable CORS with proper configuration
  const corsOrigin = configService.get<string>('cors.origin');
  const allowedOrigins = corsOrigin 
    ? corsOrigin.split(',').map(origin => origin.trim())
    : ['http://localhost:3002'];
    
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });
  
  // Use Socket.IO adapter
  app.useWebSocketAdapter(new IoAdapter(app));
  
  const port = configService.get<number>('port') || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
