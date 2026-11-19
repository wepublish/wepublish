import './instrument.ts';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NodeAdapter } from '@nestjs/platform-node';
import { AppModule } from './nestapp/app.module';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { runExampleSeed } from '../prisma/seed';

import { responseBackReference } from '@wepublish/api-token/api';
import helmet from 'helmet';

import { graphqlUploadExpress } from 'graphql-upload';
import { getBodyParsers } from './body-parsers';
import { setDefaultAutoSelectFamilyAttemptTimeout } from 'net';

// Node's happy-eyeballs gives each resolved address only 250ms to connect. The pod
// has no IPv6 route, so a single lost SYN (1s retransmit) to a dual-stack host like
// Cloudflare fails the whole request with ETIMEDOUT long before any axios timeout.
setDefaultAutoSelectFamilyAttemptTimeout(2000);

async function bootstrap() {
  const port = process.env.PORT ?? 4000;

  const nestApp = await NestFactory.create(AppModule, new NodeAdapter(), {
    bodyParser: false,
  });
  nestApp.enableShutdownHooks();
  nestApp.enableCors({
    origin: true,
    credentials: true,
  });
  nestApp.use(responseBackReference);
  nestApp.use(helmet());

  nestApp.use(...getBodyParsers());
  nestApp.use(graphqlUploadExpress());

  if (process.env.RUN_SEED === 'true') {
    Logger.log('RUN_SEED=true detected, running example seed...');
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL || 'postgresql://',
      options: '-c timezone=UTC',
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
