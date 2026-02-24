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
import {
  PAYMENT_METHOD_CONFIG,
  PaymentMethodConfig,
} from './payment-method/payment-method.config';
import { NextFunction, Request, Response } from 'express';
import { Public } from '@wepublish/authentication/api';

export const PAYMENT_WEBHOOK_PATH_PREFIX = 'payment-webhooks';

@Controller(PAYMENT_WEBHOOK_PATH_PREFIX)
export class PaymentWebhookController {
  private logger = new Logger('PaymentWebhookController');

  constructor(
    @Inject(PAYMENT_METHOD_CONFIG)
    private config: PaymentMethodConfig
  ) {}

  @Public()
  @All(':providerId')
  async receiveWebhook(
    @Param('providerId') providerId: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    this.logger.log(
      `Received webhook from ${req.get('origin')} for paymentProvider ${providerId}`
    );

    const provider = this.config.paymentProviders.find(
      provider => provider.id === providerId
    );

    if (!provider) {
      throw new NotFoundException(
        `Could not find payment provider with id ${providerId}`
      );
    }

    try {
      const response = await provider.webhookForPaymentIntent({ req });

      switch (response.status) {
        case 200: {
          if (response.paymentStates) {
            for (const paymentStatus of response.paymentStates) {
              // TODO: handle errors properly
              await provider.updatePaymentWithIntentState({
                intentState: paymentStatus,
              });
            }
          }

          return await res.status(200).send(response.message || 'OK');
        }

        default: {
          return await res.status(response.status).send(response.message);
        }
      }
    } catch (error) {
      this.logger.error(
        (error as Error).message,
        (error as Error).stack,
        `Error during webhook update in paymentProvider ${providerId}`
      );

      throw error;
    }
  }
}

export class PaymentWebhookMiddleware implements NestMiddleware {
  constructor(
    @Inject(PAYMENT_METHOD_CONFIG)
    private config: PaymentMethodConfig
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const providerId = req.params['providerId'];

    const provider = this.config.paymentProviders.find(
      provider => provider.id === providerId
    );

    if (provider?.incomingRequestHandler) {
      provider.incomingRequestHandler(req, res, next);
    } else {
      next();
    }
  }
}
