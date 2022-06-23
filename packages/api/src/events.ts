import {Invoice, Prisma, SubscriptionPeriod} from '@prisma/client'
import {EventEmitter} from 'events'
import TypedEmitter from 'typed-emitter'
import {Context} from './context'
import {Article} from './db/article'
import {SendMailType} from './mails/mailContext'
import {logger} from './server'

interface ModelEvents<T> {
  create: (context: Context, model: T) => void
  update: (context: Context, model: T) => void
  delete: (context: Context, id: string) => void
}

export interface PublishableModelEvents<T> extends ModelEvents<T> {
  publish: (context: Context, model: T) => void
  unpublish: (context: Context, model: T) => void
}

export type ArticleModelEventEmitter = TypedEmitter<PublishableModelEvents<Article>>
export const articleModelEvents = new EventEmitter() as ArticleModelEventEmitter

export type EventsEmitter = ArticleModelEventEmitter

type NormalProxyMethods = 'create' | 'update' | 'delete'
type PublishableProxyMethods = NormalProxyMethods | 'publish' | 'unpublish'

interface MethodsToProxy {
  key: string
  methods: (NormalProxyMethods | PublishableProxyMethods)[]
  eventEmitter: EventsEmitter
}

export const methodsToProxy: MethodsToProxy[] = [
  {
    key: 'article',
    methods: ['create', 'update', 'delete', 'publish', 'unpublish'],
    eventEmitter: articleModelEvents
  }
]

/**
 * This event listener is used after invoice has been marked as paid. The following logic is responsible to
 * update the subscription periode, eventually create a permanent user out of the temp user and sending mails
 * to the user.
 */
export const onInvoiceUpdate = (context: Context): Prisma.Middleware => async (params, next) => {
  if (params.model !== 'Invoice') {
    next(params)
    return
  }

  if (params.action !== 'update') {
    next(params)
    return
  }

  const model: Invoice = await next(params)

  // only activate subscription, if invoice has a paidAt and subscriptionID.
  if (!model.paidAt || !model.subscriptionID) {
    return
  }

  let mailTypeToSend = SendMailType.NewMemberSubscription
  let subscription = await context.prisma.subscription.findUnique({
    where: {
      id: model.subscriptionID
    }
  })

  if (!subscription) {
    return
  }

  const {periods} = subscription
  const period = periods.find((period: SubscriptionPeriod) => period.invoiceID === model.id)

  if (!period) {
    logger('events').warn(`No period found for subscription with ID ${subscription.id}.`)
    return
  }

  // remove eventual deactivation object from subscription (in case the subscription has been auto-deactivated but the
  // respective invoice was paid later on). Also update the paidUntil field of the subscription
  if (subscription.paidUntil === null || period.endsAt > subscription.paidUntil) {
    subscription = await context.prisma.subscription.update({
      where: {id: subscription.id},
      data: {
        paidUntil: period.endsAt,
        deactivation: null
      }
    })

    if (!subscription) {
      logger('events').warn(`Could not update Subscription.`)
      return
    }

    // in case of multiple periods we need to send a renewal member subscription instead of the default new member subscription mail
    if (periods.length > 1) {
      mailTypeToSend = SendMailType.RenewedMemberSubscription
    }

    // send mails including login link
    const user = await context.prisma.user.findUnique({
      where: {
        id: subscription.userID
      }
    })

    if (!user) {
      logger('events').warn(`User not found %s`, subscription.userID)
      return
    }

    const token = context.generateJWT({
      id: user.id,
      expiresInMinutes: parseInt(process.env.SEND_LOGIN_JWT_EXPIRES_MIN as string)
    })

    await context.mailContext.sendMail({
      type: mailTypeToSend,
      recipient: user.email,
      data: {
        url: context.urlAdapter.getLoginURL(token),
        user,
        subscription
      }
    })
  }
}
