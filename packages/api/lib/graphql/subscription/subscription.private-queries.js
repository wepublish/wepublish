"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveSubscriptionsHistory = exports.getNewSubscribersYear = exports.getSubscriptionsAsCSV = exports.getAdminSubscriptions = exports.getSubscriptionById = void 0;
const user_1 = require("../../db/user");
const utility_1 = require("../../utility");
const permissions_1 = require("../permissions");
const subscription_queries_1 = require("./subscription.queries");
const date_fns_1 = require("date-fns");
const getSubscriptionById = (id, authenticate, subscription) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetSubscription, roles);
    return subscription.findUnique({
        where: {
            id
        },
        include: {
            deactivation: true,
            periods: true,
            properties: true
        }
    });
};
exports.getSubscriptionById = getSubscriptionById;
const getAdminSubscriptions = (filter, sortedField, order, cursorId, skip, take, authenticate, subscription) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetSubscriptions, roles);
    return (0, subscription_queries_1.getSubscriptions)(filter, sortedField, order, cursorId, skip, take, subscription);
};
exports.getAdminSubscriptions = getAdminSubscriptions;
const getSubscriptionsAsCSV = async (filter, authenticate, subscription) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetSubscriptions, roles);
    (0, permissions_1.authorise)(permissions_1.CanGetUsers, roles);
    const subscriptions = await subscription.findMany({
        where: (0, subscription_queries_1.createSubscriptionFilter)(filter),
        orderBy: {
            modifiedAt: 'desc'
        },
        include: {
            deactivation: true,
            periods: true,
            properties: true,
            memberPlan: true,
            user: {
                select: user_1.unselectPassword
            },
            paymentMethod: true
        }
    });
    return (0, utility_1.mapSubscriptionsAsCsv)(subscriptions);
};
exports.getSubscriptionsAsCSV = getSubscriptionsAsCSV;
const getNewSubscribersYear = async (authenticate, subscription) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetSubscriptions, roles);
    return (await Promise.all([
        subscription.count({
            where: {
                startsAt: {
                    gte: (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(new Date(), 11))
                },
                AND: {
                    startsAt: {
                        lte: (0, date_fns_1.lastDayOfMonth)((0, date_fns_1.subMonths)(new Date(), 11))
                    }
                }
            }
        }),
        subscription.count({
            where: {
                startsAt: {
                    gte: (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(new Date(), 10))
                },
                AND: {
                    startsAt: {
                        lte: (0, date_fns_1.lastDayOfMonth)((0, date_fns_1.subMonths)(new Date(), 10))
                    }
                }
            }
        }),
        subscription.count({
            where: {
                startsAt: {
                    gte: (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(new Date(), 9))
                },
                AND: {
                    startsAt: {
                        lte: (0, date_fns_1.lastDayOfMonth)((0, date_fns_1.subMonths)(new Date(), 9))
                    }
                }
            }
        }),
        subscription.count({
            where: {
                startsAt: {
                    gte: (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(new Date(), 8))
                },
                AND: {
                    startsAt: {
                        lte: (0, date_fns_1.lastDayOfMonth)((0, date_fns_1.subMonths)(new Date(), 8))
                    }
                }
            }
        }),
        subscription.count({
            where: {
                startsAt: {
                    gte: (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(new Date(), 7))
                },
                AND: {
                    startsAt: {
                        lte: (0, date_fns_1.lastDayOfMonth)((0, date_fns_1.subMonths)(new Date(), 7))
                    }
                }
            }
        }),
        subscription.count({
            where: {
                startsAt: {
                    gte: (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(new Date(), 6))
                },
                AND: {
                    startsAt: {
                        lte: (0, date_fns_1.lastDayOfMonth)((0, date_fns_1.subMonths)(new Date(), 6))
                    }
                }
            }
        }),
        subscription.count({
            where: {
                startsAt: {
                    gte: (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(new Date(), 5))
                },
                AND: {
                    startsAt: {
                        lte: (0, date_fns_1.lastDayOfMonth)((0, date_fns_1.subMonths)(new Date(), 5))
                    }
                }
            }
        }),
        subscription.count({
            where: {
                startsAt: {
                    gte: (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(new Date(), 4))
                },
                AND: {
                    startsAt: {
                        lte: (0, date_fns_1.lastDayOfMonth)((0, date_fns_1.subMonths)(new Date(), 4))
                    }
                }
            }
        }),
        subscription.count({
            where: {
                startsAt: {
                    gte: (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(new Date(), 3))
                },
                AND: {
                    startsAt: {
                        lte: (0, date_fns_1.lastDayOfMonth)((0, date_fns_1.subMonths)(new Date(), 3))
                    }
                }
            }
        }),
        subscription.count({
            where: {
                startsAt: {
                    gte: (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(new Date(), 2))
                },
                AND: {
                    startsAt: {
                        lte: (0, date_fns_1.lastDayOfMonth)((0, date_fns_1.subMonths)(new Date(), 2))
                    }
                }
            }
        }),
        subscription.count({
            where: {
                startsAt: {
                    gte: (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(new Date(), 1))
                },
                AND: {
                    startsAt: {
                        lte: (0, date_fns_1.lastDayOfMonth)((0, date_fns_1.subMonths)(new Date(), 1))
                    }
                }
            }
        }),
        subscription.count({
            where: {
                startsAt: {
                    gte: (0, date_fns_1.startOfMonth)(new Date())
                },
                AND: {
                    startsAt: {
                        lte: (0, date_fns_1.lastDayOfMonth)(new Date())
                    }
                }
            }
        })
    ])).map((total, index) => {
        const month = new Date();
        month.setMonth(month.getMonth() + index + 1);
        return { month: (0, date_fns_1.format)(month, 'MMM'), subscriberCount: total };
    });
};
exports.getNewSubscribersYear = getNewSubscribersYear;
const getActiveSubscriptionsHistory = async (subscription) => {
    const fullYear = new Date();
    fullYear.setFullYear(fullYear.getFullYear() - 1);
    fullYear.setDate(1);
    // const jan = subs.nodes.forEach(value => value.)
};
exports.getActiveSubscriptionsHistory = getActiveSubscriptionsHistory;
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
//# sourceMappingURL=subscription.private-queries.js.map