import {
  All,
  Controller,
  Inject,
  Injectable,
  Logger,
  NestMiddleware,
  NotFoundException,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import { LetterLogState, PrismaClient } from '@prisma/client';
import { Public } from '@wepublish/authentication/api';
import { NextFunction, Request, Response } from 'express';
import { LetterState } from './letter-provider/letter-provider.interface';
import {
  LETTERS_MODULE_OPTIONS,
  LettersModuleOptions,
} from './letters-module-options';

export const LETTER_WEBHOOK_PATH_PREFIX = 'letter-webhooks';

const LOG_STATES: Record<LetterState, LetterLogState> = {
  [LetterState.submitted]: LetterLogState.submitted,
  [LetterState.accepted]: LetterLogState.accepted,
  [LetterState.dispatched]: LetterLogState.dispatched,
  [LetterState.delivered]: LetterLogState.delivered,
  [LetterState.undeliverable]: LetterLogState.undeliverable,
  [LetterState.rejected]: LetterLogState.rejected,
  [LetterState.canceled]: LetterLogState.canceled,
};

@Controller(LETTER_WEBHOOK_PATH_PREFIX)
export class LetterWebhookController {
  private logger = new Logger('LetterWebhookController');

  constructor(
    private prisma: PrismaClient,
    @Inject(LETTERS_MODULE_OPTIONS)
    private config: LettersModuleOptions
  ) {}

  @Public()
  @All(':providerId')
  async receiveWebhook(
    @Param('providerId') providerId: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    this.logger.log(
      `Received webhook from ${req.get('origin')} for letterProvider ${providerId}`
    );

    const provider =
      this.config.letterProvider?.id === providerId ?
        this.config.letterProvider
      : undefined;

    if (!provider) {
      throw new NotFoundException(
        `Could not find letter provider with id ${providerId}`
      );
    }

    const statuses = await provider.webhookForSendLetter({ req });

    for (const status of statuses) {
      const letterLog = await this.prisma.letterLog.findUnique({
        where: { providerLetterID: status.providerLetterID },
      });

      if (!letterLog) {
        this.logger.warn(
          `No letter log found for provider letter ${status.providerLetterID}`
        );

        continue;
      }

      await this.prisma.letterLog.update({
        where: { id: letterLog.id },
        data: {
          state: LOG_STATES[status.state],
          letterData: status.letterData,
          error: status.error ?? letterLog.error,
        },
      });
    }

    res.status(200).send();
  }
}

@Injectable()
export class LetterWebhookMiddleware implements NestMiddleware {
  constructor(
    @Inject(LETTERS_MODULE_OPTIONS)
    private config: LettersModuleOptions
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const providerId = req.params['providerId'];

    const provider =
      this.config.letterProvider?.id === providerId ?
        this.config.letterProvider
      : undefined;

    if (provider?.incomingRequestHandler) {
      provider.incomingRequestHandler(req, res, next);
    } else {
      next();
    }
  }
}
