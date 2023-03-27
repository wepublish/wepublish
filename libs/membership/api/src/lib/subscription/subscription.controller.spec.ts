import nock from 'nock'
import {
  contextFromRequest,
  defineInvoiceItemFactory,
  defineSubscriptionPeriodFactory,
  MailgunMailProvider,
  OldContextService,
  PrismaService
} from '@wepublish/api'
import {
  MailTemplate,
  PaymentPeriodicity,
  PrismaClient,
  Subscription,
  SubscriptionDeactivationReason,
  SubscriptionEvent
} from '@prisma/client'
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
import {Action} from '../subscription-event-dictionary/subscription-event-dictionary.type'
import {SubscriptionEventDictionary} from '../subscription-event-dictionary/subscription-event-dictionary'

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
  const SubscriptionPeriodFactory = defineSubscriptionPeriodFactory({
    defaultData: {
      invoice: {
        connect: {
          id: 'invalid'
        }
      }
    }
  })
  const InvoiceItemFactory = defineInvoiceItemFactory()

  const createSubscriptionForInvoiceCreation = async (
    validUntil: Date,
    paymentPeriodicity: PaymentPeriodicity
  ) => {
    const subscription = await SubscriptionFactory.create({
      monthlyAmount: 10,
      paymentPeriodicity: paymentPeriodicity,
      paidUntil: validUntil,
      startsAt: sub(validUntil, {years: 3, days: -1}),
      periods: {
        create: {
          startsAt: sub(validUntil, {years: 1, days: -1}),
          endsAt: validUntil,
          paymentPeriodicity: PaymentPeriodicity.yearly,
          amount: 10,
          invoice: {
            create: {
              paymentDeadline: null,
              mail: 'test@wepublish.com',
              dueAt: sub(validUntil, {years: 1}),
              paidAt: sub(validUntil, {years: 1})
            }
          }
        }
      }
    })

    const invoice1 = await InvoiceFactory.create()
    const invoice2 = await InvoiceFactory.create()

    await prismaClient.subscription.update({
      where: {
        id: subscription.id
      },
      data: {
        periods: {
          createMany: {
            data: [
              {
                startsAt: sub(validUntil, {years: 3, days: -1}),
                endsAt: sub(validUntil, {years: 2}),
                paymentPeriodicity: PaymentPeriodicity.yearly,
                amount: 10,
                invoiceID: invoice1.id
              },
              {
                startsAt: sub(validUntil, {years: 2, days: -1}),
                endsAt: sub(validUntil, {years: 1}),
                paymentPeriodicity: PaymentPeriodicity.yearly,
                amount: 10,
                invoiceID: invoice2.id
              }
            ]
          }
        }
      }
    })
    return await prismaClient.subscription.findUnique({
      where: {
        id: subscription.id
      },
      include: {
        periods: true,
        memberPlan: true,
        user: true
      }
    })
  }

  const getUpdatedSubscriptionAfterInvoiceCreation = async (subscription: Subscription) => {
    return prismaClient.subscription.findUnique({
      where: {
        id: subscription!.id
      },
      include: {
        periods: true,
        memberPlan: true,
        user: true,
        invoices: {
          include: {
            items: true
          }
        }
      }
    })
  }

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
  it('invoice creation yearly', async () => {
    const action: Action = {
      type: SubscriptionEvent.DEACTIVATION_UNPAID,
      daysAwayFromEnding: 10,
      externalMailTemplate: 'test'
    }
    const paidUntil = add(new Date(), {days: 14})
    const subscription = await createSubscriptionForInvoiceCreation(
      paidUntil,
      PaymentPeriodicity.yearly
    )
    await subscriptionController.createInvoice(subscription!, action)
    const updatedSubscription = await getUpdatedSubscriptionAfterInvoiceCreation(subscription!)
    const addedPeriod = updatedSubscription!.periods.find(
      period =>
        period.startsAt.getTime() === add(paidUntil, {days: 1}).getTime() &&
        period.endsAt.getTime() === add(paidUntil, {years: 1}).getTime()
    )
    expect(addedPeriod).not.toBeUndefined()
    expect(addedPeriod!.amount).toEqual(120)
    expect(addedPeriod!.paymentPeriodicity).toEqual(PaymentPeriodicity.yearly)

    expect(updatedSubscription!.invoices.length).toEqual(1)
    const invoice = updatedSubscription!.invoices[0]
    expect(invoice.dueAt).toEqual(paidUntil)
    expect(invoice.paymentDeadline).toEqual(add(paidUntil, {days: 10}))
    expect(invoice.items.length).toEqual(1)
    const item = invoice.items[0]
    expect(item.amount).toEqual(120)
    expect(item.quantity).toEqual(1)
    expect(item.name).toEqual('memberplan')
    expect(item.description).toEqual('yearly renewal of subscription memberplan')
  })

  it('invoice creation monthly', async () => {
    const action: Action = {
      type: SubscriptionEvent.DEACTIVATION_UNPAID,
      daysAwayFromEnding: 3,
      externalMailTemplate: 'test'
    }
    const paidUntil = add(new Date(), {days: 7})
    const subscription = await createSubscriptionForInvoiceCreation(
      paidUntil,
      PaymentPeriodicity.monthly
    )
    await subscriptionController.createInvoice(subscription!, action)
    const updatedSubscription = await getUpdatedSubscriptionAfterInvoiceCreation(subscription!)
    const addedPeriod = updatedSubscription!.periods.find(
      period =>
        period.startsAt.getTime() === add(paidUntil, {days: 1}).getTime() &&
        period.endsAt.getTime() === add(paidUntil, {months: 1}).getTime()
    )
    expect(addedPeriod).not.toBeUndefined()
    expect(addedPeriod!.amount).toEqual(10)
    expect(addedPeriod!.paymentPeriodicity).toEqual(PaymentPeriodicity.monthly)

    expect(updatedSubscription!.invoices.length).toEqual(1)
    const invoice = updatedSubscription!.invoices[0]
    expect(invoice.dueAt).toEqual(paidUntil)
    expect(invoice.paymentDeadline).toEqual(add(paidUntil, {days: 3}))
    expect(invoice.items.length).toEqual(1)
    const item = invoice.items[0]
    expect(item.amount).toEqual(10)
    expect(item.quantity).toEqual(1)
    expect(item.name).toEqual('memberplan')
    expect(item.description).toEqual('monthly renewal of subscription memberplan')
  })

  it('invoice creation quarterly', async () => {
    const action: Action = {
      type: SubscriptionEvent.DEACTIVATION_UNPAID,
      daysAwayFromEnding: 30,
      externalMailTemplate: 'test'
    }
    const paidUntil = add(new Date(), {days: 30})
    const subscription = await createSubscriptionForInvoiceCreation(
      paidUntil,
      PaymentPeriodicity.quarterly
    )
    await subscriptionController.createInvoice(subscription!, action)
    const updatedSubscription = await getUpdatedSubscriptionAfterInvoiceCreation(subscription!)
    const addedPeriod = updatedSubscription!.periods.find(
      period =>
        period.startsAt.getTime() === add(paidUntil, {days: 1}).getTime() &&
        period.endsAt.getTime() === add(paidUntil, {months: 3}).getTime()
    )
    expect(addedPeriod).not.toBeUndefined()
    expect(addedPeriod!.amount).toEqual(30)
    expect(addedPeriod!.paymentPeriodicity).toEqual(PaymentPeriodicity.quarterly)

    expect(updatedSubscription!.invoices.length).toEqual(1)
    const invoice = updatedSubscription!.invoices[0]
    expect(invoice.paymentDeadline).toEqual(add(paidUntil, {days: 30}))
    const item = invoice.items[0]
    expect(item.amount).toEqual(30)
    expect(item.description).toEqual('quarterly renewal of subscription memberplan')
  })

  it('invoice creation biannual', async () => {
    const action: Action = {
      type: SubscriptionEvent.DEACTIVATION_UNPAID,
      daysAwayFromEnding: 1,
      externalMailTemplate: 'test'
    }
    const paidUntil = add(new Date(), {days: 5})
    const subscription = await createSubscriptionForInvoiceCreation(
      paidUntil,
      PaymentPeriodicity.biannual
    )
    await subscriptionController.createInvoice(subscription!, action)
    const updatedSubscription = await getUpdatedSubscriptionAfterInvoiceCreation(subscription!)
    const addedPeriod = updatedSubscription!.periods.find(
      period =>
        period.startsAt.getTime() === add(paidUntil, {days: 1}).getTime() &&
        period.endsAt.getTime() === add(paidUntil, {months: 6}).getTime()
    )
    expect(addedPeriod).not.toBeUndefined()
    expect(addedPeriod!.amount).toEqual(60)
    expect(addedPeriod!.paymentPeriodicity).toEqual(PaymentPeriodicity.biannual)

    expect(updatedSubscription!.invoices.length).toEqual(1)
    const invoice = updatedSubscription!.invoices[0]
    expect(invoice.paymentDeadline).toEqual(add(paidUntil, {days: 1}))
    const item = invoice.items[0]
    expect(item.amount).toEqual(60)
    expect(item.description).toEqual('biannual renewal of subscription memberplan')
  })

  it('mark Invoice as paid (renewal)', async () => {
    const paidUntil = new Date()
    const subscription = await SubscriptionFactory.create({
      paidUntil: add(paidUntil, {days: 5}),
      createdAt: sub(new Date(), {years: 1, days: 4}),
      paymentPeriodicity: PaymentPeriodicity.yearly
    })
    const invoice = await InvoiceFactory.create({
      paidAt: null,
      subscription: {
        connect: {
          id: subscription.id
        }
      }
    })
    const invoiceToMarkAsPaid = await prismaClient.invoice.findUnique({
      where: {
        id: invoice.id
      },
      include: {
        subscription: true
      }
    })
    await subscriptionController.markInvoiceAsPaid(invoiceToMarkAsPaid!)
    const invoiceMarkedAsPaid = await prismaClient.invoice.findUnique({
      where: {
        id: invoice.id
      },
      include: {
        subscription: true
      }
    })

    expect(invoiceMarkedAsPaid).toBeDefined()
    expect(invoiceMarkedAsPaid!.paidAt).not.toBeNull()
    expect(invoiceMarkedAsPaid!.subscription).toBeDefined()
    expect(invoiceMarkedAsPaid!.subscription!.paidUntil).toEqual(
      add(paidUntil, {years: 1, days: 5})
    )
  })

  it('mark Invoice as paid (initial)', async () => {
    const createdAt = new Date()
    const subscription = await SubscriptionFactory.create({
      paidUntil: null,
      createdAt: sub(createdAt, {days: 4}),
      paymentPeriodicity: PaymentPeriodicity.yearly
    })
    const invoice = await InvoiceFactory.create({
      paidAt: null,
      subscription: {
        connect: {
          id: subscription.id
        }
      }
    })
    const invoiceToMarkAsPaid = await prismaClient.invoice.findUnique({
      where: {
        id: invoice.id
      },
      include: {
        subscription: true
      }
    })
    await subscriptionController.markInvoiceAsPaid(invoiceToMarkAsPaid!)
    const invoiceMarkedAsPaid = await prismaClient.invoice.findUnique({
      where: {
        id: invoice.id
      },
      include: {
        subscription: true
      }
    })

    expect(invoiceMarkedAsPaid).toBeDefined()
    expect(invoiceMarkedAsPaid!.paidAt).not.toBeNull()
    expect(invoiceMarkedAsPaid!.subscription).toBeDefined()
    expect(invoiceMarkedAsPaid!.subscription!.paidUntil).toEqual(
      sub(createdAt, {years: -1, days: 4})
    )
  })
  it('deactivate subscription', async () => {
    const subscription = await SubscriptionFactory.create()
    const invoice = await InvoiceFactory.create({
      canceledAt: null,
      subscription: {
        connect: {
          id: subscription.id
        }
      }
    })
    const invoiceToDeactivate = await prismaClient.invoice.findUnique({
      where: {
        id: invoice.id
      },
      include: {
        subscription: true
      }
    })
    await subscriptionController.deactivateSubscription(invoiceToDeactivate!)
    const invoiceToDeactivateDeactivated = await prismaClient.invoice.findUnique({
      where: {
        id: invoice.id
      },
      include: {
        subscription: {
          include: {
            deactivation: true
          }
        }
      }
    })

    expect(invoiceToDeactivateDeactivated).toBeDefined()
    expect(invoiceToDeactivateDeactivated!.canceledAt).not.toBeNull()
    expect(invoiceToDeactivateDeactivated!.subscription).toBeDefined()
    expect(invoiceToDeactivateDeactivated!.subscription!.deactivation).toBeDefined()
    expect(invoiceToDeactivateDeactivated!.subscription!.deactivation!.reason).toEqual(
      SubscriptionDeactivationReason.invoiceNotPaid
    )
    expect(invoiceToDeactivateDeactivated!.subscription!.deactivation!.date).toBeDefined()
  })

  it('payment invalid payment provider', async () => {
    const memberplan = await MemberPlanFactory.create()
    const user = await UserFactory.create()
    const paymentMethode = await PaymentMethodFactory.create({
      paymentProviderID: 'invalid'
    })

    const subscription = await SubscriptionFactory.create({
      memberPlan: {
        connect: {
          id: memberplan.id
        }
      },
      user: {
        connect: {
          id: user.id
        }
      },
      paymentMethod: {
        connect: {
          id: paymentMethode.id
        }
      }
    })
    const item = await InvoiceItemFactory.create()

    const invoice = await InvoiceFactory.create({
      subscription: {
        connect: {
          id: subscription.id
        }
      },
      items: {
        connect: {
          id: item.id
        }
      }
    })

    const period = await SubscriptionPeriodFactory.create({
      invoice: {
        connect: {
          id: invoice.id
        }
      }
    })
    await prismaClient.subscription.update({
      where: {
        id: subscription.id
      },
      data: {
        periods: {
          connect: {
            id: period.id
          }
        }
      }
    })

    const actions: Action[] = [
      {
        daysAwayFromEnding: 999,
        type: SubscriptionEvent.RENEWAL_FAILED,
        externalMailTemplate: 'failed-template'
      },
      {
        daysAwayFromEnding: 999,
        type: SubscriptionEvent.RENEWAL_SUCCESS,
        externalMailTemplate: 'success-template'
      }
    ]

    const testableInvoice = await prismaClient.invoice.findUnique({
      where: {
        id: invoice.id
      },
      include: {
        items: true,
        subscriptionPeriods: true,
        subscription: {
          include: {
            paymentMethod: true,
            user: {
              include: {
                paymentProviderCustomers: true
              }
            },
            memberPlan: true
          }
        }
      }
    })
    if (
      !testableInvoice!.subscription!.user ||
      !testableInvoice!.subscription!.paymentMethod ||
      !testableInvoice!.subscription!.memberPlan
    ) {
      throw new Error('Something important not found!')
    }
    try {
      await subscriptionController.chargeInvoice(testableInvoice!, actions)
      throw Error('This execution should fail!')
    } catch (e) {
      expect((e as Error).toString()).toEqual('Error: Payment Provider invalid not found!')
    }
  })
})
