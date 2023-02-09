/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import {PaymentPeriodicity, PrismaClient} from '@prisma/client'
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

  const mailTemplate1 = await prisma.mailTemplate.upsert({
    where: {
      externalMailTemplateId: 'sample-slug-1'
    },
    update: {},
    create: {
      name: 'sample-template-existing',
      description: 'sample-template-description',
      externalMailTemplateId: 'sample-slug-1'
    }
  })

  const mailTemplate2 = await prisma.mailTemplate.upsert({
    where: {
      externalMailTemplateId: 'sample-slug-2'
    },
    update: {},
    create: {
      name: 'sample-template-deleted',
      description: 'sample-template-description',
      externalMailTemplateId: 'sample-slug-2',
      remoteMissing: true
    }
  })

  const paymentMethod = await prisma.paymentMethod.upsert({
    where: {
      id: '1'
    },
    update: {},
    create: {
      name: 'Shiny Rocks',
      slug: 'shiny-rocks',
      description: 'Payment by transaction of a handful of shiny rocks',
      paymentProviderID: '1234',
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

  const subscriptionInterval1 = await prisma.subscriptionInterval.upsert({
    where: {
      id: 1
    },
    update: {},
    create: {
      daysAwayFromEnding: 3,
      mailTemplate: {connect: {id: mailTemplate1.id}}
    }
  })

  const subscriptionInterval2 = await prisma.subscriptionInterval.upsert({
    where: {
      id: 1
    },
    update: {},
    create: {
      daysAwayFromEnding: 3,
      mailTemplate: {connect: {id: mailTemplate1.id}}
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
      autoRenewal: [],

      subscribeMailTemplate: {connect: {id: mailTemplate1.id}},
      invoiceCreationMailTemplate: {connect: {id: subscriptionInterval1.id}},
      renewalFailedMailTemplate: {connect: {id: mailTemplate2.id}},

      additionalIntervals: {connect: [{id: subscriptionInterval2.id}]}
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
      autoRenewal: [true],

      subscribeMailTemplate: {connect: {id: mailTemplate1.id}},
      invoiceCreationMailTemplate: {connect: {id: subscriptionInterval1.id}},
      renewalFailedMailTemplate: {connect: {id: mailTemplate2.id}},

      additionalIntervals: {connect: [{id: subscriptionInterval2.id}]}
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
      autoRenewal: [false],

      invoiceCreationMailTemplate: {connect: {id: subscriptionInterval1.id}},
      renewalFailedMailTemplate: {connect: {id: mailTemplate2.id}},

      additionalIntervals: {connect: [{id: subscriptionInterval2.id}]}
    }
  })

  await prisma.$disconnect()
}

seed()
