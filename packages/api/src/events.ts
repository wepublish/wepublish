import {Invoice, Prisma, SubscriptionPeriod, PrismaClient} from '@prisma/client'
import {Context} from './context'
import {SendMailType} from './mails/mailContext'
import {logger} from './server'

// @TODO: move into cron job
export const onFindArticle = (prisma: PrismaClient): Prisma.Middleware => async (params, next) => {
  if (!(params.model === 'Article' && params.action.startsWith('find'))) {
    return next(params)
  }

  // skip the call inside this middleware to not create an infinite loop
  if (params.args?.where?.pending?.is?.AND?.publishAt?.lte) {
    return next(params)
  }

  const articles = await prisma.article.findMany({
    where: {
      pending: {
        is: {
          AND: {
            publishAt: {
              lte: new Date()
            }
          }
        }
      }
    }
  })

  await Promise.all(
    articles.map(({id, pending}) =>
      prisma.article.update({
        where: {
          id
        },
        data: {
          modifiedAt: new Date(),
          pending: null,
          published: pending
        }
      })
    )
  )

  return next(params)
}

// @TODO: move into cron job
export const onFindPage = (prisma: PrismaClient): Prisma.Middleware => async (params, next) => {
  if (!(params.model === 'Page' && params.action.startsWith('find'))) {
    return next(params)
  }

  // skip the call inside this middleware to not create an infinite loop
  if (params.args?.where?.pending?.is?.AND?.publishAt?.lte) {
    return next(params)
  }

  const pages = await prisma.page.findMany({
    where: {
      pending: {
        is: {
          AND: {
            publishAt: {
              lte: new Date()
            }
          }
        }
      }
    }
  })

  await Promise.all(
    pages.map(({id, pending}) =>
      prisma.page.update({
        where: {
          id
        },
        data: {
          modifiedAt: new Date(),
          pending: null,
          published: pending
        }
      })
    )
  )

  return next(params)
}

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
