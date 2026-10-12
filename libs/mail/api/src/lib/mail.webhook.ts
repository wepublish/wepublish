import {
  All,
  Controller,
  Inject,
  Logger,
  NestMiddleware,
  NotFoundException,
  Optional,
  Param,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';

import { NextFunction, Request, Response } from 'express';
import { Public } from '@wepublish/authentication/api';
import {
  MAILS_MODULE_OPTIONS,
  MailsModuleOptions,
} from './mails-module-options';
import {
  EmailQualityEventSource,
  MailLogState,
  PrismaClient,
} from '@prisma/client';
import {
  EMAIL_QUALITY_RECORDER,
  EmailQualityRecorder,
  recordEmailQualitySafely,
} from './email-quality-recorder';
import {
  MailLogStatus,
  MailWebhookSignatureError,
} from './mail-provider/mail-provider.interface';

export const MAIL_WEBHOOK_PATH_PREFIX = 'mail-webhooks';

// Partial: letter states (neuewege) never arrive through this webhook
const MAIL_LOG_STATE_RANK: Partial<Record<MailLogState, number>> = {
  [MailLogState.submitted]: 0,
  [MailLogState.accepted]: 1,
  [MailLogState.deferred]: 2,
  [MailLogState.delivered]: 3,
  [MailLogState.bounced]: 4,
  [MailLogState.rejected]: 4,
};

/**
 * Provider events arrive out of order and get retried: a late `send` must not
 * turn a bounced mail back into a delivered one. A state only moves forward.
 */
export const shouldUpdateMailLogState = (
  current: MailLogState,
  next: MailLogState
) => (MAIL_LOG_STATE_RANK[next] ?? 0) >= (MAIL_LOG_STATE_RANK[current] ?? 0);

@Controller(MAIL_WEBHOOK_PATH_PREFIX)
export class MailWebhookController {
  private logger = new Logger('MailWebhookController');

  constructor(
    private prisma: PrismaClient,
    @Inject(MAILS_MODULE_OPTIONS)
    private config: MailsModuleOptions,
    @Optional()
    @Inject(EMAIL_QUALITY_RECORDER)
    private emailQualityRecorder?: EmailQualityRecorder
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
        await this.apply(mailLogStatus);
      }
    } catch (error) {
      if (error instanceof MailWebhookSignatureError) {
        throw new UnauthorizedException(error.message);
      }

      // Not the provider's problem: a retry would fail the same way, and
      // some providers (Brevo) drop the event for good on any other answer.
      this.logger.error(
        (error as Error).message,
        (error as Error).stack,
        `Error during webhook update in mailProvider ${providerId}`
      );
    }

    return res.status(200).send();
  }

  private async apply(mailLogStatus: MailLogStatus) {
    const { mailLogID, email, qualitySignals } = mailLogStatus;

    // An event without one of our mails behind it, e.g. a campaign bounce.
    if (!mailLogID) {
      if (email && qualitySignals?.length) {
        await recordEmailQualitySafely(this.emailQualityRecorder, recorder =>
          recorder.recordAddressSignals({
            email,
            signals: qualitySignals,
            source: EmailQualityEventSource.webhook,
          })
        );
      }

      return;
    }

    const mailLog = await this.prisma.mailLog.findUnique({
      where: { id: mailLogID },
    });

    if (!mailLog) {
      return; // TODO: handle missing mailLog
    }

    if (
      mailLogStatus.state &&
      shouldUpdateMailLogState(mailLog.state, mailLogStatus.state)
    ) {
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

    if (qualitySignals?.length) {
      await recordEmailQualitySafely(this.emailQualityRecorder, recorder =>
        recorder.recordMailSignals({
          mailLogId: mailLog.id,
          userId: mailLog.recipientID,
          signals: qualitySignals,
          source: EmailQualityEventSource.webhook,
        })
      );
    }
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
