import express, { Application } from 'express';
import pino from 'pino';
import pinoHttp from 'pino-http';

import { serverLogger, setLogger } from '@wepublish/utils/api';

export interface WepublishServerOpts {
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

    publicApp.use(
      pinoHttp({
        logger: serverLogger.logger,
        useLevel: 'debug',
      })
    );

    // publicApp.use(`/${MAIL_WEBHOOK_PATH_PREFIX}`, setupMailProvider(this.opts));
    // publicApp.use(
    //   `/${PAYMENT_WEBHOOK_PATH_PREFIX}`,
    //   setupPaymentProvider(this.opts)
    // );
  }
}
