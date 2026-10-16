import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NodeAdapter } from '@nestjs/platform-node';
import { AppModule } from './app';

async function bootstrap() {
  const port = Number(process.env.PORT ?? 4104);
  const app = await NestFactory.create(AppModule, new NodeAdapter(), {
    logger: false,
  });
  await app.listen(port);
}

bootstrap();
