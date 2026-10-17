import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { json, urlencoded } from 'body-parser';
import helmet from 'helmet';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { AppModule } from './app';

const MAX_PAYLOAD_SIZE = '1MB';
const MAIL_WEBHOOK_PATH_PREFIX = 'mail-webhooks';
const PAYMENT_WEBHOOK_PATH_PREFIX = 'payment-webhooks';

async function bootstrap() {
  const port = Number(process.env.PORT ?? 4101);

  const app = await NestFactory.create(AppModule, new ExpressAdapter(), {
    bodyParser: false,
    logger: false,
  });
  app.enableCors({ origin: true, credentials: true });
  app.use(helmet());

  const skipPrefixes = [
    `/${MAIL_WEBHOOK_PATH_PREFIX}`,
    `/${PAYMENT_WEBHOOK_PATH_PREFIX}`,
  ] as const;
  const jsonParser = json({ limit: MAX_PAYLOAD_SIZE });

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
  app.use(conditionalJson);
  app.use(urlencoded({ extended: true, limit: MAX_PAYLOAD_SIZE }));

  await app.listen(port);
}

bootstrap();
