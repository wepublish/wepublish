import {PaymentPeriodicity, PrismaClient, SubscriptionEvent, UserEvent} from '@prisma/client'
import {seed as rootSeed} from '../../../libs/api/prisma/seed'
import {hashPassword} from '../../../libs/api/src/lib/db/user'

async function seed() {
  const prisma = new PrismaClient()
  await prisma.$connect()

  const [adminUserRole, editorUserRole] = await rootSeed(prisma)

  if (!adminUserRole || !editorUserRole) {
    throw new Error('@wepublish/api seeding has not been done')
  }

  const dev = await prisma.user.upsert({
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

  const editor = await prisma.user.upsert({
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
  for (let i = 0; i < 10; i++) {
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

  await prisma.subscription.upsert({
    where: {
      id: '1'
    },
    update: {},
    create: {
      id: '1',
      paymentPeriodicity: PaymentPeriodicity.biannual,
      paymentMethod: {connect: {id: paymentMethod.id}},
      memberPlan: {connect: {id: memberPlan.id}},
      monthlyAmount: 3,
      autoRenew: true,
      startsAt: new Date().toISOString(),
      user: {connect: {id: editor.id}}
    }
  })

  await prisma.subscription.upsert({
    where: {
      id: '2'
    },
    update: {},
    create: {
      id: '2',
      paymentPeriodicity: PaymentPeriodicity.biannual,
      paymentMethod: {connect: {id: paymentMethod.id}},
      memberPlan: {connect: {id: memberPlan.id}},
      monthlyAmount: 3,
      autoRenew: false,
      startsAt: new Date().toISOString(),
      user: {connect: {id: dev.id}}
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

  const flow1 = await prisma.subscriptionFlow.upsert({
    where: {
      id: '62f5c0f1-c047-4037-b085-f428717700c5'
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

  const flow2 = await prisma.subscriptionFlow.upsert({
    where: {
      id: '4a5c51b4-9499-45e4-82ea-b01c990ad87d'
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

  const flow3 = await prisma.subscriptionFlow.upsert({
    where: {
      id: 'a0031cb7-e5e9-4008-9973-3c4d6bf40601'
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

  const subscriptionFlows = [flow1, flow2, flow3]

  const events = [
    {
      id: '7876ff5f-5317-4a7f-a20b-c9f5638efabd',
      event: SubscriptionEvent.SUBSCRIBE,
      daysAwayFromEnding: null,
      mailTemplate: {connect: {id: mailTemplates[0].id}},
      subscriptionFlow: {connect: {id: subscriptionFlows[0].id}}
    },
    {
      id: 'bd34f37e-c3df-4f7b-a107-823cf99d11d2',
      event: SubscriptionEvent.RENEWAL_SUCCESS,
      daysAwayFromEnding: null,
      mailTemplate: {connect: {id: mailTemplates[1].id}},
      subscriptionFlow: {connect: {id: subscriptionFlows[0].id}}
    },
    {
      id: 'c1e8f944-17d1-4917-8db1-36c4f9814ec5',
      event: SubscriptionEvent.RENEWAL_FAILED,
      daysAwayFromEnding: null,
      mailTemplate: {connect: {id: mailTemplates[2].id}},
      subscriptionFlow: {connect: {id: subscriptionFlows[0].id}}
    },
    {
      id: '35f4fc42-8051-440f-8859-7b540d6689fa',
      event: SubscriptionEvent.INVOICE_CREATION,
      daysAwayFromEnding: -14,
      mailTemplate: {connect: {id: mailTemplates[3].id}},
      subscriptionFlow: {connect: {id: subscriptionFlows[0].id}}
    },
    {
      id: '1a065754-3806-4e0f-9c8e-115302b3c702',
      event: SubscriptionEvent.DEACTIVATION_UNPAID,
      daysAwayFromEnding: 5,
      mailTemplate: {connect: {id: mailTemplates[4].id}},
      subscriptionFlow: {connect: {id: subscriptionFlows[0].id}}
    },
    {
      id: '9fb2b84b-ae11-4a3c-90a4-e04dcb68309e',
      event: SubscriptionEvent.DEACTIVATION_BY_USER,
      daysAwayFromEnding: null,
      mailTemplate: {connect: {id: mailTemplates[5].id}},
      subscriptionFlow: {connect: {id: subscriptionFlows[0].id}}
    },
    {
      id: '28059bc3-7984-4db3-bb5a-2533b71fd855',
      event: SubscriptionEvent.REACTIVATION,
      daysAwayFromEnding: null,
      mailTemplate: {connect: {id: mailTemplates[6].id}},
      subscriptionFlow: {connect: {id: subscriptionFlows[0].id}}
    },
    {
      id: '19b41358-b313-4635-9950-02c1248f8db4',
      event: SubscriptionEvent.CUSTOM,
      daysAwayFromEnding: 15,
      mailTemplate: {connect: {id: mailTemplates[7].id}},
      subscriptionFlow: {connect: {id: subscriptionFlows[0].id}}
    },

    {
      id: '847448f2-9985-469a-bfc5-7f8b957c67af',
      event: SubscriptionEvent.DEACTIVATION_UNPAID,
      daysAwayFromEnding: 10,
      mailTemplate: {connect: {id: mailTemplates[8].id}},
      subscriptionFlow: {connect: {id: subscriptionFlows[1].id}}
    },
    {
      id: 'e8ba6158-fbfd-4d36-aa78-fd608f666232',
      event: SubscriptionEvent.DEACTIVATION_BY_USER,
      daysAwayFromEnding: null,
      mailTemplate: {connect: {id: mailTemplates[9].id}},
      subscriptionFlow: {connect: {id: subscriptionFlows[1].id}}
    },
    {
      id: '987db417-778e-482e-b1b9-06d3dfa54803',
      event: SubscriptionEvent.REACTIVATION,
      daysAwayFromEnding: null,
      mailTemplate: {connect: {id: mailTemplates[0].id}},
      subscriptionFlow: {connect: {id: subscriptionFlows[1].id}}
    },
    {
      id: '96c35c14-9897-48f2-9484-1919b2f8a2a9',
      event: SubscriptionEvent.CUSTOM,
      daysAwayFromEnding: -6,
      mailTemplate: {connect: {id: mailTemplates[1].id}},
      subscriptionFlow: {connect: {id: subscriptionFlows[1].id}}
    },
    {
      id: 'fbae3149-3018-454c-908d-685c83246540',
      event: SubscriptionEvent.INVOICE_CREATION,
      daysAwayFromEnding: -30,
      mailTemplate: {connect: {id: mailTemplates[2].id}},
      subscriptionFlow: {connect: {id: subscriptionFlows[1].id}}
    },
    {
      id: 'eee0ff57-4e3c-4d73-b158-de0ae979e9a7',
      event: SubscriptionEvent.SUBSCRIBE,
      daysAwayFromEnding: null,
      mailTemplate: {connect: {id: mailTemplates[3].id}},
      subscriptionFlow: {connect: {id: subscriptionFlows[2].id}}
    },
    {
      id: '82f8b2a0-38e8-4b9f-9996-9beff5ed195f',
      event: SubscriptionEvent.RENEWAL_SUCCESS,
      daysAwayFromEnding: null,
      mailTemplate: {connect: {id: mailTemplates[4].id}},
      subscriptionFlow: {connect: {id: subscriptionFlows[2].id}}
    },
    {
      id: '1c1b5f7a-c49d-4734-beef-a38477f38e13',
      event: SubscriptionEvent.RENEWAL_FAILED,
      daysAwayFromEnding: null,
      mailTemplate: {connect: {id: mailTemplates[5].id}},
      subscriptionFlow: {connect: {id: subscriptionFlows[2].id}}
    },
    {
      id: 'b23386cf-eb10-453d-8bc7-586caad230c7',
      event: SubscriptionEvent.INVOICE_CREATION,
      daysAwayFromEnding: -30,
      mailTemplate: {connect: {id: mailTemplates[6].id}},
      subscriptionFlow: {connect: {id: subscriptionFlows[2].id}}
    },
    {
      id: 'f2b663e5-ac95-4d89-8b08-ca3fb470362a',
      event: SubscriptionEvent.DEACTIVATION_UNPAID,
      daysAwayFromEnding: 10,
      mailTemplate: {connect: {id: mailTemplates[7].id}},
      subscriptionFlow: {connect: {id: subscriptionFlows[2].id}}
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

  let eventIndex = 0
  let ids = [
    'e18d1855-4772-405f-bd16-c26fbe95d206',
    'f51a6cce-f509-4b85-80d1-288ee6702b11',
    'adc6759e-d593-499e-9785-1563f616dda5',
    '4e1d7d50-230e-4e9d-9244-2a67a4b4f2f5'
  ]
  for (const event in UserEvent) {
    await prisma.userFlowMail.upsert({
      where: {
        id: ids[eventIndex]
      },
      update: {},
      create: {
        event: UserEvent[event as UserEvent],
        mailTemplate: {connect: {id: mailTemplates[eventIndex % 5].id}}
      }
    })
    eventIndex++
  }

  await prisma.$disconnect()
}

seed()
