import { ApolloServer } from 'apollo-server-express';
import express, { Application, NextFunction, Request, Response } from 'express';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { contextFromRequest, ContextOptions } from './context';
import { GraphQLWepublishSchema } from './graphql/schema';
import { MAIL_WEBHOOK_PATH_PREFIX } from '@wepublish/mail/api';
import { PAYMENT_WEBHOOK_PATH_PREFIX, setupPaymentProvider } from './payments';
import {
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginUsageReportingDisabled,
} from 'apollo-server-core';
import { graphqlUploadExpress } from 'graphql-upload';
import { setupMailProvider } from './mails';
import {
  logger,
  MAX_PAYLOAD_SIZE,
  serverLogger,
  setLogger,
} from '@wepublish/utils/api';
import { printSchema } from 'graphql';
import * as fs from 'fs';

export interface WepublishServerOpts extends ContextOptions {
  readonly playground?: boolean;
  readonly introspection?: boolean;
  readonly logger?: pino.Logger;
}

export class WepublishServer {
  constructor(
    private opts: WepublishServerOpts,
    private publicApp?: Application | undefined
  ) {}

  async listen(port?: number, hostname?: string): Promise<void> {
    if (!this.publicApp) {
      this.publicApp = express();
    }
    const publicApp = this.publicApp;

    setLogger(this.opts.logger);

    const adminServer = new ApolloServer({
      schema: GraphQLWepublishSchema,
      plugins: [
        ApolloServerPluginUsageReportingDisabled(),
        this.opts.playground ?
          ApolloServerPluginLandingPageGraphQLPlayground()
        : ApolloServerPluginLandingPageDisabled(),
      ],
      introspection: true,
      context: ({ req }) => contextFromRequest(req, this.opts),
      cache: 'bounded',
      persistedQueries: false,
    });

    if (process.env['NODE_ENV'] !== 'production') {
      await fs.promises.writeFile(
        './apps/api-example/schema-v1-admin.graphql',
        printSchema(GraphQLWepublishSchema)
      );
    }

    await adminServer.start();

    const corsOptions = {
      origin: true,
      credentials: true,
      allowedHeaders: [
        'authorization',
        'content-type',
        'content-length',
        'accept',
        'origin',
        'user-agent',
      ],
      methods: ['POST', 'GET', 'OPTIONS'],
    };

    publicApp.use(
      pinoHttp({
        logger: serverLogger.logger,
        useLevel: 'debug',
      })
    );

    publicApp.use(`/${MAIL_WEBHOOK_PATH_PREFIX}`, setupMailProvider(this.opts));
    publicApp.use(
      `/${PAYMENT_WEBHOOK_PATH_PREFIX}`,
      setupPaymentProvider(this.opts)
    );

    publicApp.use(graphqlUploadExpress());

    adminServer.applyMiddleware({
      app: publicApp,
      path: '/v1/admin',
      cors: corsOptions,
      bodyParserConfig: { limit: MAX_PAYLOAD_SIZE },
    });

    publicApp.use(
      (err: any, req: Request, res: Response, next: NextFunction) => {
        logger('server').error(err);
        if (err.status) {
          res.status(err.status);
          res.send({ error: err.message });
        } else {
          res.status(500).end();
        }
      }
    );
  }
}
