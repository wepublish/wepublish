import { PrismaClient } from '@prisma/client';
import {
  AlgebraicCaptchaChallenge,
  CfTurnstile,
  ChallengeProvider,
  WepublishServer,
} from '@wepublish/api';
import pinoMultiStream from 'pino-multi-stream';
import { createWriteStream } from 'pino-sentry';
import pinoStackdriver from 'pino-stackdriver';
import * as process from 'process';
import { Application } from 'express';
import { readConfig } from '../readConfig';
import { URLAdapter, HauptstadtURLAdapter } from '@wepublish/nest-modules';
import { HotAndTrendingDataSource } from '@wepublish/article/api';
import { MediaAdapter } from '@wepublish/image/api';
import { MailProvider } from '@wepublish/mail/api';
import { PaymentProvider } from '@wepublish/payment/api';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type RunServerProps = {
  publicExpressApp?: Application;
  mediaAdapter: MediaAdapter;
  paymentProviders: PaymentProvider[];
  mailProvider: MailProvider;
  hotAndTrendingDataSource: HotAndTrendingDataSource;
};

export async function runServer({
  publicExpressApp,
  mediaAdapter,
  mailProvider,
  paymentProviders,
}: RunServerProps) {
  /*
   * Load User specific configuration
   */

  const config = await readConfig(process.env.CONFIG_FILE_PATH);

  /*
   * Basic configuration
   */

  if (!process.env.DATABASE_URL)
    throw new Error('No DATABASE_URL defined in environment.');
  if (!process.env.HOST_URL)
    throw new Error('No HOST_URL defined in environment.');
  if (!process.env.WEBSITE_URL)
    throw new Error('No WEBSITE_URL defined in environment.');
  const hostURL = process.env.HOST_URL;
  const websiteURL = process.env.WEBSITE_URL;
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3002;
  const address = process.env.ADDRESS ? process.env.ADDRESS : 'localhost';

  /*
   * Media Adapter configuration
   */

  if (!process.env.MEDIA_SERVER_URL)
    throw new Error('No MEDIA_SERVER_URL defined in environment.');
  if (!process.env.MEDIA_SERVER_TOKEN)
    throw new Error('No MEDIA_SERVER_TOKEN defined in environment.');

  /*
   * Connect to database
   */

  const prisma = new PrismaClient();
  await prisma.$connect();

  /*
   * Load logging providers
   */

  const prettyStream = pinoMultiStream.prettyStream();
  const streams: pinoMultiStream.Streams = [{ stream: prettyStream }];
  if (process.env.GOOGLE_PROJECT) {
    streams.push({
      level: 'info',
      stream: pinoStackdriver.createWriteStream({
        projectId: process.env.GOOGLE_PROJECT,
        logName: 'wepublish_api',
      }),
    });
  }

  if (process.env.SENTRY_DSN) {
    streams.push({
      level: 'error',
      stream: createWriteStream({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.SENTRY_ENV ?? 'dev',
      }),
    });
  }

  const logger = pinoMultiStream({
    streams,
    level: 'debug',
  });

  const urlAdapter =
    config.general.urlAdapter === 'hauptstadt' ?
      new HauptstadtURLAdapter(websiteURL)
    : new URLAdapter(websiteURL);

  /**
   * Challenge
   */
  let challenge: ChallengeProvider;
  if (config.challenge.type === 'turnstile') {
    challenge = new CfTurnstile(
      config.challenge.secret,
      config.challenge.siteKey
    );
  } else {
    challenge = new AlgebraicCaptchaChallenge(
      config.challenge.secret,
      config.challenge.validTime,
      {
        width: config.challenge.width,
        height: config.challenge.height,
        background: config.challenge.background,
        noise: config.challenge.noise,
        minValue: config.challenge.minValue,
        maxValue: config.challenge.maxValue,
        operandAmount: config.challenge.operandAmount,
        operandTypes: config.challenge.operandTypes,
        mode: config.challenge.mode,
        targetSymbol: config.challenge.targetSymbol,
      }
    );
  }

  /**
   * Load session time to live (TTL)
   */
  const sessionTTLDays =
    config.general.sessionTTLDays ? config.general.sessionTTLDays : 7;
  const sessionTTL = sessionTTLDays * MS_PER_DAY;

  // Workaround since context will be deleted anyways
  const kv: any = {};
  const server = new WepublishServer(
    {
      hostURL,
      websiteURL,
      sessionTTL,
      mediaAdapter,
      prisma,
      mailProvider,
      mailContextOptions: {
        defaultFromAddress:
          config.mailProvider.fromAddress || 'dev@wepublish.ch',
        defaultReplyToAddress:
          config.mailProvider.replyToAddress || 'reply-to@wepublish.ch',
      },
      paymentProviders,
      urlAdapter,
      playground:
        config.general.apolloPlayground ?
          config.general.apolloPlayground
        : false,
      introspection:
        config.general.apolloIntrospection ?
          config.general.apolloIntrospection
        : false,
      logger,
      challenge,
      kv,
    },
    publicExpressApp
  );

  await server.listen(port, address);
}
