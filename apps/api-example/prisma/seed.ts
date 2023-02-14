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

  const mailTemplates = []
  for(const i of [9,12,13,15,17,95,92,8,5,3]) {
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

  const daysBefore = [1,5,3,6,7,4,2]
  const subscriptionIntervals = []
  for(const days of daysBefore) {
    const index = daysBefore.indexOf(days)
    const interval = await prisma.subscriptionInterval.upsert({
      where: {
        id: index + 1
      },
      update: {},
      create: {
        daysAwayFromEnding: days,
        mailTemplate: {connect: {id: mailTemplates[index].id}}
      }
    })
    subscriptionIntervals.push(interval)
  }

  await prisma.subscriptionFlow.upsert({
    where: {
      id: 1
    },
    update: {},
    create: {
      default: true,
      memberPlan: {connect: {id: memberPlan.id}},
      paymentMethods: undefined,
      periodicities: [],
      autoRenewal: [],

      subscribeMailTemplate: {connect: {id: mailTemplates[0].id}},
      invoiceCreationMailTemplate: {connect: {id: subscriptionIntervals[0].id}},
      renewalFailedMailTemplate: {connect: {id: mailTemplates[1].id}},

      additionalIntervals: {connect: [{id: subscriptionIntervals[2].id}]}
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

      subscribeMailTemplate: {connect: {id: mailTemplates[2].id}},
      invoiceCreationMailTemplate: {connect: {id: subscriptionIntervals[3].id}},
      renewalFailedMailTemplate: {connect: {id: mailTemplates[3].id}},

      additionalIntervals: {connect: [{id: subscriptionIntervals[4].id}]}
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

      invoiceCreationMailTemplate: {connect: {id: subscriptionIntervals[5].id}},
      renewalFailedMailTemplate: {connect: {id: mailTemplates[4].id}},

      additionalIntervals: {connect: [{id: subscriptionIntervals[6].id}]}
    }
  })

  await prisma.$disconnect()
}

seed()
