import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import helmet from 'helmet';
import { Logger, NestApplicationOptions } from '@nestjs/common';

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

  if (process.env['MEDIA_FALLBACK_URL']) {
    Logger.log(
      `Media fallback URL: ${process.env['MEDIA_FALLBACK_URL']}`,
      'Bootstrap'
    );
  }

  return { app, port };
}
