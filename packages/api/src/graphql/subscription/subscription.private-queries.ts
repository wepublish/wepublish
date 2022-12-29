import {PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {SubscriptionFilter, SubscriptionSort} from '../../db/subscription'
import {unselectPassword} from '../../db/user'
import {mapSubscriptionsAsCsv} from '../../utility'
import {authorise, CanGetSubscription, CanGetSubscriptions, CanGetUsers} from '../permissions'
import {createSubscriptionFilter, getSubscriptions} from './subscription.queries'
import {format, lastDayOfMonth, startOfMonth, subMonths} from 'date-fns'

export const getSubscriptionById = (
  id: string,
  authenticate: Context['authenticate'],
  subscription: PrismaClient['subscription']
) => {
  const {roles} = authenticate()
  authorise(CanGetSubscription, roles)

  return subscription.findUnique({
    where: {
      id
    },
    include: {
      deactivation: true,
      periods: true,
      properties: true
    }
  })
}

export const getAdminSubscriptions = (
  filter: Partial<SubscriptionFilter>,
  sortedField: SubscriptionSort,
  order: 1 | -1,
  cursorId: string | null,
  skip: number,
  take: number,
  authenticate: Context['authenticate'],
  subscription: PrismaClient['subscription']
) => {
  const {roles} = authenticate()
  authorise(CanGetSubscriptions, roles)

  return getSubscriptions(filter, sortedField, order, cursorId, skip, take, subscription)
}

export const getSubscriptionsAsCSV = async (
  filter: SubscriptionFilter,
  authenticate: Context['authenticate'],
  subscription: PrismaClient['subscription']
) => {
  const {roles} = authenticate()
  authorise(CanGetSubscriptions, roles)
  authorise(CanGetUsers, roles)

  const subscriptions = await subscription.findMany({
    where: createSubscriptionFilter(filter),
    orderBy: {
      modifiedAt: 'desc'
    },
    include: {
      deactivation: true,
      periods: true,
      properties: true,
      memberPlan: true,
      user: {
        select: unselectPassword
      },
      paymentMethod: true
    }
  })

  return mapSubscriptionsAsCsv(subscriptions)
}

export const getNewSubscribersYear = async (subscription: PrismaClient['subscription']) => {
  return (
    await Promise.all([
      subscription.count({
        where: {
          startsAt: {
            gte: startOfMonth(subMonths(new Date(), 11))
          },
          AND: {
            startsAt: {
              lte: lastDayOfMonth(subMonths(new Date(), 11))
            }
          }
        }
      }),
      subscription.count({
        where: {
          startsAt: {
            gte: startOfMonth(subMonths(new Date(), 10))
          },
          AND: {
            startsAt: {
              lte: lastDayOfMonth(subMonths(new Date(), 10))
            }
          }
        }
      }),
      subscription.count({
        where: {
          startsAt: {
            gte: startOfMonth(subMonths(new Date(), 9))
          },
          AND: {
            startsAt: {
              lte: lastDayOfMonth(subMonths(new Date(), 9))
            }
          }
        }
      }),
      subscription.count({
        where: {
          startsAt: {
            gte: startOfMonth(subMonths(new Date(), 8))
          },
          AND: {
            startsAt: {
              lte: lastDayOfMonth(subMonths(new Date(), 8))
            }
          }
        }
      }),
      subscription.count({
        where: {
          startsAt: {
            gte: startOfMonth(subMonths(new Date(), 7))
          },
          AND: {
            startsAt: {
              lte: lastDayOfMonth(subMonths(new Date(), 7))
            }
          }
        }
      }),
      subscription.count({
        where: {
          startsAt: {
            gte: startOfMonth(subMonths(new Date(), 6))
          },
          AND: {
            startsAt: {
              lte: lastDayOfMonth(subMonths(new Date(), 6))
            }
          }
        }
      }),
      subscription.count({
        where: {
          startsAt: {
            gte: startOfMonth(subMonths(new Date(), 5))
          },
          AND: {
            startsAt: {
              lte: lastDayOfMonth(subMonths(new Date(), 5))
            }
          }
        }
      }),
      subscription.count({
        where: {
          startsAt: {
            gte: startOfMonth(subMonths(new Date(), 4))
          },
          AND: {
            startsAt: {
              lte: lastDayOfMonth(subMonths(new Date(), 4))
            }
          }
        }
      }),
      subscription.count({
        where: {
          startsAt: {
            gte: startOfMonth(subMonths(new Date(), 3))
          },
          AND: {
            startsAt: {
              lte: lastDayOfMonth(subMonths(new Date(), 3))
            }
          }
        }
      }),
      subscription.count({
        where: {
          startsAt: {
            gte: startOfMonth(subMonths(new Date(), 2))
          },
          AND: {
            startsAt: {
              lte: lastDayOfMonth(subMonths(new Date(), 2))
            }
          }
        }
      }),
      subscription.count({
        where: {
          startsAt: {
            gte: startOfMonth(subMonths(new Date(), 1))
          },
          AND: {
            startsAt: {
              lte: lastDayOfMonth(subMonths(new Date(), 1))
            }
          }
        }
      }),
      subscription.count({
        where: {
          startsAt: {
            gte: startOfMonth(new Date())
          },
          AND: {
            startsAt: {
              lte: lastDayOfMonth(new Date())
            }
          }
        }
      })
    ])
  ).map((total: number, index) => {
    const month = new Date()
    month.setMonth(month.getMonth() + index + 1)
    return {month: format(month, 'MMM'), subscriberCount: total}
  })
}

export const getActiveSubscriptionsHistory = async (subscription: PrismaClient['subscription']) => {
  const fullYear = new Date()
  fullYear.setFullYear(fullYear.getFullYear() - 1)
  fullYear.setDate(1)

  // const jan = subs.nodes.forEach(value => value.)
}

/*
export const getLatestActivity = async (
  article: PrismaClient['article'],
  // author: PrismaClient['author'],
  // comment: PrismaClient['comment'],
  // memberPlan: PrismaClient['memberPlan'],
  // navigation: PrismaClient['navigation'],
  // page: PrismaClient['page'],
  // subscription: PrismaClient['subscription'],
  // user: PrismaClient['user'],
  // userRole: PrismaClient['userRole'],
) => {

  const art =
  article.findMany({
    take: 5,
    include: {
      draft: {
        include: {
          properties: true,
          authors: true,
          socialMediaAuthors: true
        }
      },
      pending: {
        include: {
          properties: true,
          authors: true,
          socialMediaAuthors: true
        }
      },
      published: {
        include: {
          properties: true,
          authors: true,
          socialMediaAuthors: true
        }
      }
  }})
return art
}

*/
