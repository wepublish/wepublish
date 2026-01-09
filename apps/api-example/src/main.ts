import { runServer } from './app';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './nestapp/app.module';
import { MediaAdapter } from '@wepublish/image/api';
import {
  PAYMENT_METHOD_CONFIG,
  PaymentMethodConfig,
} from '@wepublish/payment/api';
import { MAIL_WEBHOOK_PATH_PREFIX, MailContext } from '@wepublish/mail/api';
import helmet from 'helmet';
import {
  HotAndTrendingDataSource,
  HOT_AND_TRENDING_DATA_SOURCE,
} from '@wepublish/article/api';
import { MAX_PAYLOAD_SIZE } from '@wepublish/utils/api';
import { PAYMENT_WEBHOOK_PATH_PREFIX } from '@wepublish/api';
import { json, urlencoded } from 'body-parser';
import type { Request, Response, NextFunction, RequestHandler } from 'express';

async function bootstrap() {
  const port = process.env.PORT ?? 4000;

  const nestApp = await NestFactory.create(AppModule);
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
  const mediaAdapter = nestApp.get(MediaAdapter);
  const paymentProviders = nestApp.get<PaymentMethodConfig>(
    PAYMENT_METHOD_CONFIG
  ).paymentProviders;
  const mailProvider = nestApp.get(MailContext).mailProvider;
  const hotAndTrendingDataSource = nestApp.get<HotAndTrendingDataSource>(
    HOT_AND_TRENDING_DATA_SOURCE
  );

  const publicExpressApp = nestApp.getHttpAdapter().getInstance();

  await runServer({
    publicExpressApp,
    mediaAdapter,
    paymentProviders,
    mailProvider,
    hotAndTrendingDataSource,
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });

  await nestApp.listen(port);
  Logger.log(`🚀 Public api is running on: http://localhost:${port}`);
}

bootstrap();
