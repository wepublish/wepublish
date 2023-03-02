/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import {PaymentPeriodicity, PrismaClient, SubscriptionEvent} from '@prisma/client'
import {seed as rootSeed} from '../../../libs/api/prisma/seed'
import {hashPassword} from '../../../libs/api/src/lib/db/user'

async function seed() {
  const prisma = new PrismaClient()
  await prisma.$connect()

  const [adminUserRole, editorUserRole] = await rootSeed(prisma)

  if (!adminUserRole || !editorUserRole) {
    throw new Error('@wepublish/api seeding has not been done')
  }

  await prisma.user.upsert({
    where: {
      email: 'dev@wepublish.ch'
    },
    update: {},
    create: {
      email: 'dev@wepublish.ch',
      emailVerifiedAt: new Date(),
      name: 'Dev User',
      active: true,
      roleIDs: [adminUserRole.id],
      password: await hashPassword('123')
    }
  })

  await prisma.user.upsert({
    where: {
      email: 'editor@wepublish.ch'
    },
    update: {},
    create: {
      email: 'editor@wepublish.ch',
      emailVerifiedAt: new Date(),
      name: 'Editor User',
      active: true,
      roleIDs: [editorUserRole.id],
      password: await hashPassword('123')
    }
  })

  const mailTemplates = []
  for (const i of [9, 12, 13, 15, 17, 95, 92, 8, 5, 3]) {
    const template = await prisma.mailTemplate.upsert({
      where: {
        externalMailTemplateId: `sample-slug-${i}`
      },
      update: {},
      create: {
        name: `sample-template-${i}`,
        description: `sample-template-description-${i}`,
        externalMailTemplateId: `sample-slug-${i}`,
        remoteMissing: false
      }
    })
    mailTemplates.push(template)
  }

  const paymentMethod = await prisma.paymentMethod.upsert({
    where: {
      id: '1'
    },
    update: {},
    create: {
      name: 'Shiny Rocks',
      slug: 'shiny-rocks',
      description: 'Payment by transaction of a handful of shiny rocks',
      paymentProviderID: 'stripe_checkout',
      active: true
    }
  })

  const memberPlan = await prisma.memberPlan.upsert({
    where: {
      slug: 'test-plan'
    },
    update: {},
    create: {
      name: 'Test Plan',
      slug: 'test-plan',
      tags: [],
      description: {},
      active: true,
      amountPerMonthMin: 1
    }
  })

  await prisma.availablePaymentMethod.upsert({
    where: {
      id: '1'
    },
    update: {},
    create: {
      paymentMethodIDs: [],
      paymentPeriodicities: [PaymentPeriodicity.monthly],
      forceAutoRenewal: false,
      MemberPlan: {connect: {id: memberPlan.id}}
    }
  })

  await prisma.subscriptionFlow.upsert({
    where: {
      id: 1
    },
    update: {},
    create: {
      default: true,
      memberPlan: undefined,
      paymentMethods: undefined,
      periodicities: [],
      autoRenewal: []
    }
  })

  await prisma.subscriptionFlow.upsert({
    where: {
      id: 2
    },
    update: {},
    create: {
      default: false,
      memberPlan: {connect: {id: memberPlan.id}},
      paymentMethods: {connect: [{id: paymentMethod.id}]},
      periodicities: [PaymentPeriodicity.monthly, PaymentPeriodicity.yearly],
      autoRenewal: [true]
    }
  })

  await prisma.subscriptionFlow.upsert({
    where: {
      id: 3
    },
    update: {},
    create: {
      default: false,
      memberPlan: {connect: {id: memberPlan.id}},
      paymentMethods: {connect: [{id: paymentMethod.id}]},
      periodicities: [PaymentPeriodicity.monthly, PaymentPeriodicity.yearly],
      autoRenewal: [false]
    }
  })

  const events = [
    {
      id: 1,
      event: SubscriptionEvent.SUBSCRIBE,
      daysAwayFromEnding: null,
      mailTemplate: {connect: {id: 1}},
      subscriptionFlow: {connect: {id: 1}}
    },
    {
      id: 2,
      event: SubscriptionEvent.RENEWAL_SUCCESS,
      daysAwayFromEnding: null,
      mailTemplate: {connect: {id: 2}},
      subscriptionFlow: {connect: {id: 1}}
    },
    {
      id: 3,
      event: SubscriptionEvent.RENEWAL_FAILED,
      daysAwayFromEnding: null,
      mailTemplate: {connect: {id: 3}},
      subscriptionFlow: {connect: {id: 1}}
    },
    {
      id: 4,
      event: SubscriptionEvent.INVOICE_CREATION,
      daysAwayFromEnding: -14,
      mailTemplate: {connect: {id: 4}},
      subscriptionFlow: {connect: {id: 1}}
    },
    {
      id: 5,
      event: SubscriptionEvent.DEACTIVATION_UNPAID,
      daysAwayFromEnding: 5,
      mailTemplate: {connect: {id: 5}},
      subscriptionFlow: {connect: {id: 1}}
    },
    {
      id: 6,
      event: SubscriptionEvent.DEACTIVATION_BY_USER,
      daysAwayFromEnding: null,
      mailTemplate: {connect: {id: 6}},
      subscriptionFlow: {connect: {id: 1}}
    },
    {
      id: 7,
      event: SubscriptionEvent.REACTIVATION,
      daysAwayFromEnding: null,
      mailTemplate: {connect: {id: 7}},
      subscriptionFlow: {connect: {id: 1}}
    },
    {
      id: 8,
      event: SubscriptionEvent.CUSTOM,
      daysAwayFromEnding: 15,
      mailTemplate: {connect: {id: 8}},
      subscriptionFlow: {connect: {id: 1}}
    },

    {
      id: 9,
      event: SubscriptionEvent.DEACTIVATION_UNPAID,
      daysAwayFromEnding: 10,
      mailTemplate: {connect: {id: 5}},
      subscriptionFlow: {connect: {id: 2}}
    },
    {
      id: 10,
      event: SubscriptionEvent.DEACTIVATION_BY_USER,
      daysAwayFromEnding: null,
      mailTemplate: {connect: {id: 6}},
      subscriptionFlow: {connect: {id: 2}}
    },
    {
      id: 11,
      event: SubscriptionEvent.REACTIVATION,
      daysAwayFromEnding: null,
      mailTemplate: {connect: {id: 7}},
      subscriptionFlow: {connect: {id: 2}}
    },
    {
      id: 12,
      event: SubscriptionEvent.CUSTOM,
      daysAwayFromEnding: -6,
      mailTemplate: {connect: {id: 8}},
      subscriptionFlow: {connect: {id: 2}}
    },
    {
      id: 17,
      event: SubscriptionEvent.INVOICE_CREATION,
      daysAwayFromEnding: -30,
      mailTemplate: {connect: {id: 4}},
      subscriptionFlow: {connect: {id: 2}}
    },
    {
      id: 13,
      event: SubscriptionEvent.SUBSCRIBE,
      daysAwayFromEnding: null,
      mailTemplate: {connect: {id: 1}},
      subscriptionFlow: {connect: {id: 3}}
    },
    {
      id: 14,
      event: SubscriptionEvent.RENEWAL_SUCCESS,
      daysAwayFromEnding: null,
      mailTemplate: {connect: {id: 2}},
      subscriptionFlow: {connect: {id: 3}}
    },
    {
      id: 15,
      event: SubscriptionEvent.RENEWAL_FAILED,
      daysAwayFromEnding: null,
      mailTemplate: {connect: {id: 3}},
      subscriptionFlow: {connect: {id: 3}}
    },
    {
      id: 16,
      event: SubscriptionEvent.INVOICE_CREATION,
      daysAwayFromEnding: -30,
      mailTemplate: {connect: {id: 4}},
      subscriptionFlow: {connect: {id: 3}}
    },
    {
      id: 18,
      event: SubscriptionEvent.DEACTIVATION_UNPAID,
      daysAwayFromEnding: 10,
      mailTemplate: {connect: {id: 5}},
      subscriptionFlow: {connect: {id: 3}}
    }
  ]

  for (const event of events) {
    const {id, ...createObj} = event
    await prisma.subscriptionInterval.upsert({
      where: {
        id: event.id
      },
      update: {},
      create: createObj
    })
  }

  await prisma.$disconnect()
}

seed()
