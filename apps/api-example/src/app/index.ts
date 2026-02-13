import { WepublishServer } from '@wepublish/api';
import pinoMultiStream from 'pino-multi-stream';
import { createWriteStream } from 'pino-sentry';
import pinoStackdriver from 'pino-stackdriver';
import * as process from 'process';
import { Application } from 'express';

type RunServerProps = {
  publicExpressApp?: Application;
};

export async function runServer({ publicExpressApp }: RunServerProps) {
  /*
   * Basic configuration
   */

  if (!process.env.DATABASE_URL)
    throw new Error('No DATABASE_URL defined in environment.');
  if (!process.env.HOST_URL)
    throw new Error('No HOST_URL defined in environment.');
  if (!process.env.WEBSITE_URL)
    throw new Error('No WEBSITE_URL defined in environment.');
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

  // Workaround since context will be deleted anyways
  const server = new WepublishServer(
    {
      logger,
    },
    publicExpressApp
  );

  await server.listen(port, address);
}
