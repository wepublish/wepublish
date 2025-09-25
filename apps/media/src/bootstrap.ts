import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import helmet from 'helmet';
import { NestApplicationOptions } from '@nestjs/common';

export async function bootstrap(logger?: NestApplicationOptions['logger']) {
  const app = await NestFactory.create(AppModule, {
    logger,
  });
  app.useGlobalPipes(new ZodValidationPipe());
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: false,
    })
  );

  const port = process.env.PORT || 4100;
  await app.listen(port);

  return { app, port };
}
