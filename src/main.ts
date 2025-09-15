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
  const defaultOrigins = [
    'http://localhost:3002',
    'http://localhost:3000',
    'https://sellia-client-3zqr5.ondigitalocean.app'
  ];
  
  const allowedOrigins = corsOrigin 
    ? corsOrigin.split(',').map(origin => origin.trim())
    : defaultOrigins;
    
  console.log('CORS Origins:', allowedOrigins);
  console.log('CORS_ORIGIN env:', corsOrigin);
    
  app.enableCors({
    origin: (origin, callback) => {
      console.log('CORS check for origin:', origin);
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('No origin, allowing request');
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        console.log('Origin allowed:', origin);
        return callback(null, true);
      }
      
      console.log('Origin blocked:', origin);
      return callback(new Error('Not allowed by CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  // Use Socket.IO adapter
  app.useWebSocketAdapter(new IoAdapter(app));
  
  const port = configService.get<number>('port') || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
