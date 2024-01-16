import {Router} from 'express'
import {contextFromRequest} from './context'
import {WepublishServerOpts} from './server'
import {logger} from '@wepublish/utils/api'

export const PAYMENT_WEBHOOK_PATH_PREFIX = 'payment-webhooks'

export function setupPaymentProvider(opts: WepublishServerOpts): Router {
  const {paymentProviders} = opts
  const paymentProviderWebhookRouter = Router()

  // setup webhook routes for each payment provider
  paymentProviders.forEach(paymentProvider => {
    paymentProviderWebhookRouter
      .route(`/${paymentProvider.id}`)
      .all(paymentProvider.incomingRequestHandler, async (req, res) => {
        await res.status(200).send() // respond immediately with 200 since webhook was received.
        logger('paymentProvider').info(
          'Received webhook from %s for paymentProvider %s',
          req.get('origin'),
          paymentProvider.id
        )
        try {
          const paymentStatuses = await paymentProvider.webhookForPaymentIntent({req})
          const context = await contextFromRequest(req, opts)

          for (const paymentStatus of paymentStatuses) {
            // TODO: handle errors properly
            await paymentProvider.updatePaymentWithIntentState({
              intentState: paymentStatus,
              paymentClient: context.prisma.payment,
              paymentsByID: context.loaders.paymentsByID,
              invoicesByID: context.loaders.invoicesByID,
              subscriptionClient: context.prisma.subscription,
              userClient: context.prisma.user,
              invoiceClient: context.prisma.invoice,
              subscriptionPeriodClient: context.prisma.subscriptionPeriod,
              invoiceItemClient: context.prisma.invoiceItem
            })
          }
        } catch (error) {
          logger('paymentProvider').error(
            error as Error,
            'Error during webhook update in paymentProvider %s',
            paymentProvider.id
          )
        }
      })
  })

  return paymentProviderWebhookRouter
}
