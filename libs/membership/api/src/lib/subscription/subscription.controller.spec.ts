import nock from 'nock'
import {
  contextFromRequest,
  MailgunMailProvider,
  OldContextService,
  PrismaService
} from '@wepublish/api'
import {MailTemplate, PrismaClient, SubscriptionDeactivationReason} from '@prisma/client'
import {
  initialize,
  defineMemberPlanFactory,
  defineMailTemplateFactory,
  defineSubscriptionFlowFactory,
  definePaymentMethodFactory,
  defineUserFactory,
  defineSubscriptionIntervalFactory,
  defineInvoiceFactory,
  definePeriodicJobFactory,
  defineSubscriptionFactory
} from '@wepublish/api'

import {initOldContextForTest} from '../../oldcontext-utils'
import {Test, TestingModule} from '@nestjs/testing'
import {forwardRef} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {SubscriptionFlowController} from '../subscription-flow/subscription-flow.controller'
import {PeriodicJobController} from '../periodic-job/periodic-job.controller'
import {SubscriptionController} from '../subscription/subscription.controller'
import {clearDatabase} from '../../prisma-utils'
import {add, sub} from 'date-fns'

describe('SubscriptionController', () => {
  let controller: OldContextService
  const prismaClient = new PrismaClient()
  initialize({prisma: prismaClient})

  const MemberPlanFactory = defineMemberPlanFactory()
  const PaymentMethodFactory = definePaymentMethodFactory()
  const SubscriptionFlowFactory = defineSubscriptionFlowFactory({
    defaultData: {
      memberPlan: MemberPlanFactory,
      intervals: {connect: []}
    }
  })
  const UserFactory = defineUserFactory()
  const InvoiceFactory = defineInvoiceFactory()
  const SubscriptionIntervalFactory = defineSubscriptionIntervalFactory({
    defaultData: {
      subscriptionFlow: SubscriptionFlowFactory
    }
  })

  const SubscriptionFactory = defineSubscriptionFactory({
    defaultData: {
      paymentMethod: {
        connectOrCreate: {
          where: {
            id: 'pp'
          },
          create: {
            id: 'pp',
            name: 'pp',
            slug: 'pp',
            description: 'pp',
            paymentProviderID: 'pp',
            active: true
          }
        }
      },
      memberPlan: {
        connectOrCreate: {
          where: {
            slug: 'memberplan'
          },
          create: {
            name: 'memberplan',
            slug: 'memberplan',
            description: 'memberplan',
            active: true,
            amountPerMonthMin: 100
          }
        }
      },
      user: {
        connectOrCreate: {
          where: {
            email: 'test@wepublish.com'
          },
          create: {
            email: 'test@wepublish.com',
            name: 'user',
            password: 'xxx',
            active: true
          }
        }
      }
    }
  })
  const MailTemplateFactory = defineMailTemplateFactory()

  let subscriptionController: SubscriptionController

  beforeEach(async () => {
    await initOldContextForTest(prismaClient)
    const module: TestingModule = await Test.createTestingModule({
      imports: [forwardRef(() => PrismaModule.forTest(prismaClient))],
      providers: [
        PrismaService,
        SubscriptionFlowController,
        PeriodicJobController,
        OldContextService,
        SubscriptionController
      ]
    }).compile()
    controller = module.get<OldContextService>(OldContextService)

    await clearDatabase(prismaClient, [
      'users',
      'subscriptions',
      'subscriptions.deactivation-reasons',
      'invoices',
      'subscriptions.periods'
    ])

    subscriptionController = new SubscriptionController(prismaClient, controller)

    // Create deactivated subscription
    await SubscriptionFactory.create({
      paidUntil: new Date(),
      deactivation: {
        create: {
          reason: SubscriptionDeactivationReason.none,
          date: new Date()
        }
      }
    })
    await SubscriptionFactory.create({
      paidUntil: sub(new Date(), {days: 100}),
      deactivation: {
        create: {
          reason: SubscriptionDeactivationReason.none,
          date: new Date()
        }
      }
    })
    await SubscriptionFactory.create({
      paidUntil: sub(new Date(), {days: 100}),
      deactivation: {
        create: {
          reason: SubscriptionDeactivationReason.none,
          date: new Date()
        }
      },
      invoices: {
        create: {
          paymentDeadline: sub(new Date(), {days: 100}),
          mail: 'test@wepublish.com',
          dueAt: sub(new Date(), {days: 100}),
          paidAt: new Date()
        }
      }
    })
    await SubscriptionFactory.create({
      paidUntil: add(new Date(), {days: 100}),
      deactivation: {
        create: {
          reason: SubscriptionDeactivationReason.none,
          date: new Date()
        }
      }
    })
    await SubscriptionFactory.create({
      paidUntil: add(new Date(), {days: 100}),
      deactivation: {
        create: {
          reason: SubscriptionDeactivationReason.none,
          date: new Date()
        }
      },
      invoices: {
        create: {
          paymentDeadline: sub(new Date(), {days: 100}),
          mail: 'test@wepublish.com',
          dueAt: sub(new Date(), {days: 100}),
          canceledAt: new Date()
        }
      }
    })
    await SubscriptionFactory.create({
      paidUntil: add(new Date(), {days: 1}),
      autoRenew: false
    })
  })

  afterEach(async () => {
    await prismaClient.$disconnect()
  })

  it('is defined', () => {
    expect(controller).toBeDefined()
  })

  it('get subscriptions for invoice creation', async () => {
    // Ensure that none deactivated subscriptions are returned
    let subscriptionsToExtend = await subscriptionController.getSubscriptionsForInvoiceCreation(
      new Date(),
      add(new Date(), {days: 200})
    )
    expect(subscriptionsToExtend.length).toEqual(0)

    // Ensure that filter for invoices works
    await SubscriptionFactory.create({
      paidUntil: add(new Date(), {days: 1}),
      invoices: {
        create: {
          paymentDeadline: sub(new Date(), {days: 2}),
          mail: 'test@wepublish.com',
          dueAt: sub(new Date(), {days: 100})
        }
      }
    })
    subscriptionsToExtend = await subscriptionController.getSubscriptionsForInvoiceCreation(
      new Date(),
      add(new Date(), {days: 200})
    )
    expect(subscriptionsToExtend.length).toEqual(0)

    let subscription = await SubscriptionFactory.create({
      paidUntil: add(new Date(), {days: 1}),
      invoices: {
        create: {
          paymentDeadline: sub(new Date(), {days: 4}),
          mail: 'test@wepublish.com',
          dueAt: sub(new Date(), {days: 100})
        }
      }
    })
    subscriptionsToExtend = await subscriptionController.getSubscriptionsForInvoiceCreation(
      new Date(),
      add(new Date(), {days: 200})
    )
    expect(subscriptionsToExtend.length).toEqual(1)
    await prismaClient.subscription.delete({where: {id: subscription.id}})

    subscription = await SubscriptionFactory.create({
      paidUntil: add(new Date(), {days: 6})
    })
    const subscription2 = await SubscriptionFactory.create({
      paidUntil: add(new Date(), {days: 5})
    })
    const subscription3 = await SubscriptionFactory.create({
      paidUntil: add(new Date(), {days: 5, seconds: 10})
    })
    subscriptionsToExtend = await subscriptionController.getSubscriptionsForInvoiceCreation(
      new Date(),
      add(new Date(), {days: 5})
    )
    expect(subscriptionsToExtend.length).toEqual(2)
    await prismaClient.subscription.deleteMany({
      where: {id: {in: [subscription.id, subscription2.id, subscription3.id]}}
    })
  })

  it('invoices to charge', async () => {
    // Ensure that none deactivated subscriptions are returned
    let invoicesToCharge = await subscriptionController.getInvoicesToCharge(new Date())
    expect(invoicesToCharge.length).toEqual(0)
    await InvoiceFactory.create({
      dueAt: sub(new Date(), {days: 1})
    })
    await InvoiceFactory.create({
      dueAt: add(new Date(), {seconds: 10})
    })
    await InvoiceFactory.create({
      dueAt: add(new Date(), {days: 1})
    })
    invoicesToCharge = await subscriptionController.getInvoicesToCharge(new Date())
    expect(invoicesToCharge.length).toEqual(2)
  })

  it('invoices of subscriptions to deactivate', async () => {
    // Ensure that none deactivated subscriptions are returned
    let invoicesToDeactivate = await subscriptionController.getSubscriptionsToDeactivate(new Date())
    expect(invoicesToDeactivate.length).toEqual(0)
    await InvoiceFactory.create({
      paymentDeadline: sub(new Date(), {days: 1})
    })
    await InvoiceFactory.create({
      paymentDeadline: sub(new Date(), {seconds: 10})
    })
    await InvoiceFactory.create({
      paymentDeadline: add(new Date(), {days: 1})
    })
    invoicesToDeactivate = await subscriptionController.getSubscriptionsToDeactivate(new Date())
    expect(invoicesToDeactivate.length).toEqual(1)
  })
})
