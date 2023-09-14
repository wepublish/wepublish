import {Invoice, Prisma, SubscriptionPeriod, PrismaClient} from '@prisma/client'
import {Context} from './context'
import {unselectPassword} from '@wepublish/user/api'
import {SendMailType} from './mails/mailContext'
import {logger} from './server'
import {SettingName} from '@wepublish/settings/api'

// @TODO: move into cron job
export const onFindArticle =
  (prisma: PrismaClient): Prisma.Middleware =>
  async (params, next) => {
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
      },
      include: {
        pending: true,
        published: true
      }
    })

    await Promise.all(
      articles.map(async ({id, publishedId, pending}) => {
        await prisma.article.update({
          where: {
            id
          },
          data: {
            published: {
              connect: {
                id: pending!.id
              }
            },
            pending: {
              disconnect: true
            }
          }
        })
        await prisma.articleRevision.delete({
          where: {
            id: publishedId || undefined
          }
        })
      })
    )

    return next(params)
  }

// @TODO: move into cron job
export const onFindPage =
  (prisma: PrismaClient): Prisma.Middleware =>
  async (params, next) => {
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
      },
      include: {
        pending: true,
        published: true
      }
    })

    await Promise.all(
      pages.map(async ({id, publishedId, pending}) => {
        await prisma.page.update({
          where: {
            id
          },
          data: {
            published: {
              connect: {
                id: pending!.id
              }
            },
            pending: {
              disconnect: true
            }
          }
        })
        await prisma.pageRevision.delete({
          where: {
            id: publishedId || undefined
          }
        })
      })
    )

    return next(params)
  }

/**
 * This event listener is used after invoice has been marked as paid. The following logic is responsible to
 * update the subscription periode, eventually create a permanent user out of the temp user and sending mails
 * to the user.
 */
export const onInvoiceUpdate =
  (context: Context): Prisma.Middleware =>
  async (params, next) => {
    if (params.model !== 'Invoice') {
      return next(params)
    }

    if (params.action !== 'update') {
      return next(params)
    }

    const model: Invoice = await next(params)

    // only activate subscription, if invoice has a paidAt and subscriptionID.
    if (!model.paidAt || !model.subscriptionID) {
      return model
    }

    let mailTypeToSend = SendMailType.NewMemberSubscription
    let subscription = await context.prisma.subscription.findUnique({
      where: {
        id: model.subscriptionID
      },
      include: {
        deactivation: true,
        periods: true,
        properties: true
      }
    })

    if (!subscription) {
      return model
    }

    const {periods} = subscription
    const period = periods.find((period: SubscriptionPeriod) => period.invoiceID === model.id)

    if (!period) {
      logger('events').warn(`No period found for subscription with ID ${subscription.id}.`)
      return model
    }

    // remove eventual deactivation object from subscription (in case the subscription has been auto-deactivated but the
    // respective invoice was paid later on). Also update the paidUntil field of the subscription
    if (subscription.paidUntil === null || period.endsAt > subscription.paidUntil) {
      subscription = await context.prisma.subscription.update({
        where: {id: subscription.id},
        data: {
          paidUntil: period.endsAt,
          deactivation: {
            delete: Boolean(subscription.deactivation)
          }
        },
        include: {
          deactivation: true,
          periods: true,
          properties: true
        }
      })

      if (!subscription) {
        logger('events').warn(`Could not update Subscription.`)
        return model
      }

      // in case of multiple periods we need to send a renewal member subscription instead of the default new member subscription mail
      if (periods.length > 1) {
        mailTypeToSend = SendMailType.RenewedMemberSubscription
      }

      // send mails including login link
      const jwtSetting = await context.prisma.setting.findUnique({
        where: {name: SettingName.SEND_LOGIN_JWT_EXPIRES_MIN}
      })
      const jwtExpires =
        (jwtSetting?.value as number) ?? parseInt(process.env.SEND_LOGIN_JWT_EXPIRES_MIN ?? '')

      if (!jwtExpires) {
        throw new Error('No value set for SEND_LOGIN_JWT_EXPIRES_MIN')
      }

      const user = await context.prisma.user.findUnique({
        where: {
          id: subscription.userID
        },
        select: unselectPassword
      })

      if (!user) {
        logger('events').warn(`User not found %s`, subscription.userID)
        return model
      }

      const token = context.generateJWT({
        id: user.id,
        expiresInMinutes: jwtExpires
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

    return model
  }
