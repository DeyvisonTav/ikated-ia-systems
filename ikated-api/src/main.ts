import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      "*",
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.getHttpAdapter().get('/api/health', (_, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'ikated-api',
      version: '1.0.0',
    });
  });

  const port = process.env.PORT ?? 3333;
  await app.listen(port);

  console.log(`🚀 Ikated API rodando na porta ${port}`);
  console.log(`📖 Health check: http://localhost:${port}/api/health`);
  console.log(`💬 Chat endpoint: http://localhost:${port}/api/chat`);
  console.log(`📄 Docs endpoint: http://localhost:${port}/api/documents`);
}

bootstrap();
