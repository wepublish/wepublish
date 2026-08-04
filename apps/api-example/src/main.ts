import './instrument.ts';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './nestapp/app.module';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { runExampleSeed } from '../prisma/seed';

import { MAIL_WEBHOOK_PATH_PREFIX } from '@wepublish/mail/api';
import helmet from 'helmet';

import { MAX_PAYLOAD_SIZE } from '@wepublish/utils/api';
import { json, urlencoded } from 'body-parser';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { PAYMENT_WEBHOOK_PATH_PREFIX } from '@wepublish/payment/api';
import { graphqlUploadExpress } from 'graphql-upload';

async function bootstrap() {
  const port = process.env.PORT ?? 4000;

  const nestApp = await NestFactory.create(AppModule, {
    bodyParser: false,
  });
  nestApp.enableCors({
    origin: true,
    credentials: true,
  });
  nestApp.use(helmet());

  const skipPrefixes = [
    `/${MAIL_WEBHOOK_PATH_PREFIX}`,
    `/${PAYMENT_WEBHOOK_PATH_PREFIX}`,
  ] as const;
  const jsonParser = json({ limit: MAX_PAYLOAD_SIZE });

  // Apply JSON parsing only when the path doesn't match any webhook prefix
  const conditionalJson: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const path: string = req.path ?? req.url;
    for (let i = 0; i < skipPrefixes.length; i++) {
      const p = skipPrefixes[i];

      if (path === p || path.startsWith(p + '/')) {
        return next();
      }
    }

    return jsonParser(req, res, next);
  };
  nestApp.use(conditionalJson);
  nestApp.use(urlencoded({ extended: true, limit: MAX_PAYLOAD_SIZE }));
  nestApp.use(graphqlUploadExpress());

  if (process.env.RUN_SEED === 'true') {
    Logger.log('RUN_SEED=true detected, running example seed...');
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL || 'postgresql://',
      max: parseInt(process.env['DATABASE_POOL_SIZE'] ?? '20'),
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 10_000,
    });
    const prisma = new PrismaClient({ adapter });
    await prisma.$connect();
    try {
      await runExampleSeed(prisma);
      Logger.log('Seeding completed successfully');
    } catch (e) {
      Logger.error('Seeding failed', e);
    } finally {
      await prisma.$disconnect();
    }
  }

  await nestApp.listen(port);
  Logger.log(`🚀 Public api is running on: http://localhost:${port}`);
}

bootstrap();
