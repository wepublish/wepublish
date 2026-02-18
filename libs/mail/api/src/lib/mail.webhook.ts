import {
  All,
  Controller,
  Inject,
  Logger,
  NestMiddleware,
  NotFoundException,
  Param,
  Req,
  Res,
} from '@nestjs/common';

import { NextFunction, Request, Response } from 'express';
import { Public } from '@wepublish/authentication/api';
import {
  MAILS_MODULE_OPTIONS,
  MailsModuleOptions,
} from './mails-module-options';
import { PrismaClient } from '@prisma/client';

export const MAIL_WEBHOOK_PATH_PREFIX = 'mail-webhooks';

@Controller(MAIL_WEBHOOK_PATH_PREFIX)
export class MailWebhookController {
  private logger = new Logger('MailWebhookController');

  constructor(
    private prisma: PrismaClient,
    @Inject(MAILS_MODULE_OPTIONS)
    private config: MailsModuleOptions
  ) {}

  @Public()
  @All(':providerId')
  async receiveWebhook(
    @Param('providerId') providerId: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    this.logger.log(
      `Received webhook from ${req.get('origin')} for mailProvider ${providerId}`
    );

    const provider =
      this.config.mailProvider?.id === providerId ?
        this.config.mailProvider
      : undefined;

    if (!provider) {
      throw new NotFoundException(
        `Could not find mail provider with id ${providerId}`
      );
    }

    try {
      const mailLogStatuses = await provider.webhookForSendMail({
        req,
      });

      for (const mailLogStatus of mailLogStatuses) {
        const mailLog = await this.prisma.mailLog.findUnique({
          where: {
            id: mailLogStatus.mailLogID,
          },
        });

        if (!mailLog) {
          continue; // TODO: handle missing mailLog
        }

        await this.prisma.mailLog.update({
          where: { id: mailLog.id },
          data: {
            subject: mailLog.subject,
            mailProviderID: mailLog.mailProviderID,
            state: mailLogStatus.state,
            mailData: mailLogStatus.mailData,
          },
        });
      }
    } catch (error) {
      this.logger.error(
        (error as Error).message,
        (error as Error).stack,
        `Error during webhook update in mailProvider ${providerId}`
      );

      throw error;
    }

    return res.status(200).send();
  }
}

export class MailWebhookMiddleware implements NestMiddleware {
  constructor(
    @Inject(MAILS_MODULE_OPTIONS)
    private config: MailsModuleOptions
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const providerId = req.params['providerId'];

    const provider =
      this.config.mailProvider?.id === providerId ?
        this.config.mailProvider
      : undefined;

    if (provider?.incomingRequestHandler) {
      provider.incomingRequestHandler(req, res, next);
    } else {
      next();
    }
  }
}
