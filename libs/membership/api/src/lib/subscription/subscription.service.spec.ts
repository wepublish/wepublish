import {
  Currency,
  PaymentPeriodicity,
  PrismaClient,
  Subscription,
  SubscriptionDeactivationReason,
  SubscriptionEvent
} from '@prisma/client'
import {
  clearDatabase,
  clearFullDatabase,
  defineInvoiceFactory,
  defineInvoiceItemFactory,
  defineMemberPlanFactory,
  definePaymentMethodFactory,
  defineSubscriptionFactory,
  defineSubscriptionPeriodFactory,
  defineUserFactory,
  initialize
} from '@wepublish/testing'
import nock from 'nock'

import {forwardRef} from '@nestjs/common'
import {Test, TestingModule} from '@nestjs/testing'
import {PrismaModule} from '@wepublish/nest-modules'
import {PaymentProviderService, PaymentService} from '@wepublish/payment/api'
import {clearDatabase, clearFullDatabase} from '@wepublish/testing'
import {add, sub} from 'date-fns'
import {PeriodicJobService} from '../periodic-job/periodic-job.service'
import {Action} from '../subscription-event-dictionary/subscription-event-dictionary.type'
import {SubscriptionFlowService} from '../subscription-flow/subscription-flow.service'
import {registerMailsModule, registerPaymentsModule} from '../testing/module-registrars'
import {SubscriptionService} from './subscription.service'

describe('SubscriptionPaymentsService', () => {
  const prismaClient = new PrismaClient()
  initialize({prisma: prismaClient})

  const MemberPlanFactory = defineMemberPlanFactory()
  const PaymentMethodFactory = definePaymentMethodFactory()
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
            amountPerMonthMin: 100,
            currency: Currency.CHF
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
  const UserFactory = defineUserFactory()
  const InvoiceFactory = defineInvoiceFactory({
    defaultData: {
      subscription: SubscriptionFactory
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

  const createDataForChargeFunction = async (
    paymentProvider = 'stripe',
    createPaymentProviderCustomer = true
  ) => {
    const memberplan = await MemberPlanFactory.create()
    const user = await UserFactory.create({
      paymentProviderCustomers: createPaymentProviderCustomer
        ? {
            create: {
              paymentProviderID: paymentProvider,
              customerID: 'stripeCustomerId'
            }
          }
        : {}
    })
    const paymentMethode = await PaymentMethodFactory.create({
      paymentProviderID: paymentProvider
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
    const item = await InvoiceItemFactory.create({
      amount: 120,
      quantity: 2
    })

    const invoice = await InvoiceFactory.create({
      mail: 'test@wepublish.com',
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

    return {
      testableInvoice: await prismaClient.invoice.findUnique({
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
      }),
      actions
    }
  }

  const createSubscriptionForInvoiceCreation = async (
    validUntil: Date,
    paymentPeriodicity: PaymentPeriodicity
  ) => {
    const subscription = await SubscriptionFactory.create({
      monthlyAmount: 10,
      paymentPeriodicity,
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
              currency: Currency.CHF,
              scheduledDeactivationAt: add(validUntil, {days: 7}),
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

  beforeAll(async () => {
    await clearFullDatabase(prismaClient)
  })

  let subscriptionService: SubscriptionService

  beforeEach(async () => {
    await nock.disableNetConnect()
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        forwardRef(() => PrismaModule.forTest(prismaClient)),
        registerMailsModule(),
        registerPaymentsModule()
      ],

      providers: [SubscriptionFlowService, PeriodicJobService, SubscriptionService]
    }).compile()
    const paymentsService = module.get<PaymentService>(PaymentService)
    const paymentProviderService = module.get<PaymentProviderService>(PaymentProviderService)

    await clearDatabase(prismaClient, [
      'payments',
      'subscriptions.periods',
      'invoices.items',
      'invoices',
      'subscriptions.deactivation-reasons',
      'member.plans.payment-methods',
      'member.plans',
      'payment.methods',
      'subscriptions',
      'users.payment-providers',
      'users'
    ])

    subscriptionService = new SubscriptionService(
      prismaClient,
      paymentsService,
      paymentProviderService
    )

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
          currency: Currency.CHF,
          scheduledDeactivationAt: sub(new Date(), {days: 100}),
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
          currency: Currency.CHF,
          scheduledDeactivationAt: sub(new Date(), {days: 100}),
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
    await nock.cleanAll()
    await nock.enableNetConnect()
    await prismaClient.$disconnect()
  })

  it('get subscriptions for invoice creation', async () => {
    // Ensure that none deactivated subscriptions are returned
    let subscriptionsToExtend = await subscriptionService.getActiveSubscriptionsWithoutInvoice(
      new Date(),
      add(new Date(), {days: 200})
    )
    expect(subscriptionsToExtend.length).toEqual(0)

    // Ensure that filter for invoices works
    await SubscriptionFactory.create({
      paidUntil: add(new Date(), {days: 1}),
      currency: Currency.CHF,
      periods: {
        create: {
          startsAt: add(new Date(), {days: 1}),
          endsAt: add(new Date(), {years: 1}),
          paymentPeriodicity: PaymentPeriodicity.yearly,
          amount: 22,
          invoice: {
            create: {
              currency: Currency.CHF,
              scheduledDeactivationAt: sub(new Date(), {days: 2}),
              mail: 'test@wepublish.com',
              dueAt: sub(new Date(), {days: 100})
            }
          }
        }
      }
    })

    let subscription = await SubscriptionFactory.create({
      paidUntil: sub(new Date(), {days: 1}),
      currency: Currency.CHF,
      periods: {
        create: {
          startsAt: sub(new Date(), {days: 1}),
          endsAt: add(new Date(), {years: 1}),
          paymentPeriodicity: PaymentPeriodicity.yearly,
          amount: 22,
          invoice: {
            create: {
              currency: Currency.CHF,
              scheduledDeactivationAt: add(new Date(), {days: 2}),
              mail: 'test@wepublish.com',
              dueAt: sub(new Date(), {days: 1})
            }
          }
        }
      }
    })
    await InvoiceFactory.create({
      mail: 'test@wepublish.com',
      subscription: {
        connect: {
          id: subscription.id
        }
      }
    })

    subscriptionsToExtend = await subscriptionService.getActiveSubscriptionsWithoutInvoice(
      new Date(),
      add(new Date(), {days: 200})
    )

    expect(subscriptionsToExtend.length).toEqual(0)

    subscription = await SubscriptionFactory.create({
      paidUntil: add(new Date(), {days: 1}),
      invoices: {
        create: {
          currency: Currency.CHF,
          scheduledDeactivationAt: sub(new Date(), {days: 4}),
          mail: 'test@wepublish.com',
          dueAt: sub(new Date(), {days: 100}),
          paidAt: sub(new Date(), {days: 100})
        }
      }
    })

    await InvoiceFactory.create({
      mail: 'test@wepublish.com',
      canceledAt: new Date(),
      subscription: {
        connect: {
          id: subscription.id
        }
      }
    })

    subscriptionsToExtend = await subscriptionService.getActiveSubscriptionsWithoutInvoice(
      new Date(),
      add(new Date(), {days: 200})
    )
    expect(subscriptionsToExtend.length).toEqual(1)
    await prismaClient.subscription.delete({where: {id: subscription.id}})

    subscription = await SubscriptionFactory.create({
      paidUntil: add(new Date(), {days: 6})
    })
    const Subscription = await SubscriptionFactory.create({
      paidUntil: add(new Date(), {days: 5})
    })
    const subscription3 = await SubscriptionFactory.create({
      paidUntil: add(new Date(), {days: 5, seconds: 10})
    })
    subscriptionsToExtend = await subscriptionService.getActiveSubscriptionsWithoutInvoice(
      new Date(),
      add(new Date(), {days: 5})
    )
    expect(subscriptionsToExtend.length).toEqual(2)
    await prismaClient.subscription.deleteMany({
      where: {id: {in: [subscription.id, Subscription.id, subscription3.id]}}
    })
  })

  it('invoices to charge', async () => {
    // Ensure that none deactivated subscriptions are returned
    let invoicesToCharge = await subscriptionService.findUnpaidDueInvoices(new Date())
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
    invoicesToCharge = await subscriptionService.findUnpaidDueInvoices(new Date())
    expect(invoicesToCharge.length).toEqual(2)
  })

  it('skips unconfirmed invoices', async () => {
    let invoicesToCharge = await subscriptionService.findUnpaidDueInvoices(new Date())
    expect(invoicesToCharge.length).toEqual(0)
    await InvoiceFactory.create({
      dueAt: sub(new Date(), {days: 1}),
      subscription: {
        create: await SubscriptionFactory.buildCreateInput({
          confirmed: true
        })
      }
    })
    await InvoiceFactory.create({
      dueAt: sub(new Date(), {days: 1}),
      subscription: {
        create: await SubscriptionFactory.buildCreateInput({
          confirmed: false
        })
      }
    })
    invoicesToCharge = await subscriptionService.findUnpaidDueInvoices(new Date())
    expect(invoicesToCharge.length).toEqual(1)
  })

  it('skips invoices without subscription', async () => {
    const inv1 = await InvoiceFactory.create({
      dueAt: sub(new Date(), {days: 1})
    })
    expect(inv1.subscriptionID).not.toEqual(null)
    let invoicesToCharge = await subscriptionService.findUnpaidDueInvoices(new Date())
    expect(invoicesToCharge.length).toEqual(1)
    expect(invoicesToCharge[0].id).toEqual(inv1.id)

    const inv2 = await InvoiceFactory.create({
      dueAt: add(new Date(), {days: 1}),
      subscription: undefined
    })
    expect(inv2.subscriptionID).toEqual(null)
    invoicesToCharge = await subscriptionService.findUnpaidDueInvoices(new Date())
    expect(invoicesToCharge.length).toEqual(1)
    expect(invoicesToCharge[0].id).toEqual(inv1.id)
  })

  it('invoices of subscriptions to deactivate', async () => {
    // Ensure that none deactivated subscriptions are returned
    let invoicesToDeactivate = await subscriptionService.findUnpaidScheduledForDeactivationInvoices(
      new Date()
    )
    expect(invoicesToDeactivate.length).toEqual(0)
    await InvoiceFactory.create({
      scheduledDeactivationAt: sub(new Date(), {days: 1})
    })
    await InvoiceFactory.create({
      scheduledDeactivationAt: sub(new Date(), {seconds: 10})
    })
    await InvoiceFactory.create({
      scheduledDeactivationAt: add(new Date(), {days: 1})
    })
    invoicesToDeactivate = await subscriptionService.findUnpaidScheduledForDeactivationInvoices(
      new Date()
    )
    expect(invoicesToDeactivate.length).toEqual(1)
  })
  it('invoice creation yearly', async () => {
    const paidUntil = add(new Date(), {days: 14})
    const deactivationDate = add(paidUntil, {days: 10})
    const subscription = await createSubscriptionForInvoiceCreation(
      paidUntil,
      PaymentPeriodicity.yearly
    )
    await subscriptionService.createInvoice(subscription!, deactivationDate)
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
    expect(invoice.scheduledDeactivationAt).toEqual(add(paidUntil, {days: 10}))
    expect(invoice.items.length).toEqual(1)
    const item = invoice.items[0]
    expect(item.amount).toEqual(120)
    expect(item.quantity).toEqual(1)
    expect(item.name).toEqual('memberplan')
    expect(item.description).toEqual('yearly renewal of subscription memberplan')
  })

  it('invoice creation monthly', async () => {
    const paidUntil = add(new Date(), {days: 7})
    const deactivationDate = add(paidUntil, {days: 3})
    const subscription = await createSubscriptionForInvoiceCreation(
      paidUntil,
      PaymentPeriodicity.monthly
    )
    await subscriptionService.createInvoice(subscription!, deactivationDate)
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
    expect(invoice.scheduledDeactivationAt).toEqual(add(paidUntil, {days: 3}))
    expect(invoice.items.length).toEqual(1)
    const item = invoice.items[0]
    expect(item.amount).toEqual(10)
    expect(item.quantity).toEqual(1)
    expect(item.name).toEqual('memberplan')
    expect(item.description).toEqual('monthly renewal of subscription memberplan')
  })

  it('invoice creation quarterly', async () => {
    const paidUntil = add(new Date(), {days: 30})
    const deactivationDate = add(paidUntil, {days: 30})
    const subscription = await createSubscriptionForInvoiceCreation(
      paidUntil,
      PaymentPeriodicity.quarterly
    )
    await subscriptionService.createInvoice(subscription!, deactivationDate)
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
    expect(invoice.scheduledDeactivationAt).toEqual(add(paidUntil, {days: 30}))
    const item = invoice.items[0]
    expect(item.amount).toEqual(30)
    expect(item.description).toEqual('quarterly renewal of subscription memberplan')
  })

  it('invoice creation biannual', async () => {
    const paidUntil = add(new Date(), {days: 5})
    const deactivationDate = add(paidUntil, {days: 1})
    const subscription = await createSubscriptionForInvoiceCreation(
      paidUntil,
      PaymentPeriodicity.biannual
    )
    await subscriptionService.createInvoice(subscription!, deactivationDate)
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
    expect(invoice.scheduledDeactivationAt).toEqual(add(paidUntil, {days: 1}))
    const item = invoice.items[0]
    expect(item.amount).toEqual(60)
    expect(item.description).toEqual('biannual renewal of subscription memberplan')
  })

  it('mark Invoice as paid (renewal)', async () => {
    const paidUntil = add(new Date(), {days: 5})
    const subscription = await SubscriptionFactory.create({
      paidUntil,
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
    await subscriptionService.markInvoiceAsPaid(invoiceToMarkAsPaid!)
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
    expect(invoiceMarkedAsPaid!.subscription!.paidUntil).toEqual(add(paidUntil, {years: 1}))
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
    await subscriptionService.markInvoiceAsPaid(invoiceToMarkAsPaid!)
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
    await subscriptionService.deactivateSubscription(invoiceToDeactivate!)
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

  it('Charge invoice: Payment invalid payment provider', async () => {
    const {testableInvoice, actions} = await createDataForChargeFunction('invalid')
    try {
      await subscriptionService.chargeInvoice(testableInvoice!, actions)
      throw Error('This execution should fail!')
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        'NotFoundException: Payment Provider invalid not found!'
      )
    }
  })

  it('Charge invoice: No offsession payment provider', async () => {
    const {testableInvoice, actions} = await createDataForChargeFunction('payrexx')
    const answer = await subscriptionService.chargeInvoice(testableInvoice!, actions)
    expect(answer.action).toBeUndefined()
    expect(answer.errorCode).toEqual('')
  })

  it('Charge invoice: missing payment provider customer', async () => {
    const {testableInvoice, actions} = await createDataForChargeFunction('stripe', false)
    const answer = await subscriptionService.chargeInvoice(testableInvoice!, actions)
    expect(answer.action?.daysAwayFromEnding).toEqual(999)
    expect(answer.action?.type).toEqual('RENEWAL_FAILED')
    expect(answer.action?.externalMailTemplate).toEqual('failed-template')
    expect(answer.errorCode).toEqual('customer-not-found')
  })

  it('Charge invoice: Stripe offsession payment customer deleted or no default', async () => {
    const {testableInvoice, actions} = await createDataForChargeFunction()
    const stripeGetCustomersDeletedCustomer = await nock('https://api.stripe.com')
      .get('/v1/customers/stripeCustomerId')
      .replyWithFile(200, __dirname + '/__fixtures__/stripeGetDeletedCustomers.json', {
        'Content-Type': 'application/json'
      })
    const stripePaymentIntentDeletedCustomer = await nock('https://api.stripe.com', {
      encodedQueryParams: true
    })
      .post(
        '/v1/payment_intents',
        /amount=240&payment_method_types\[0\]=card&currency=chf&metadata\[paymentID\]=.*&metadata\[mail\]=test%40wepublish.com/g
      )
      .replyWithFile(200, __dirname + '/__fixtures__/stripePostPaymentIntentSuccess.json', {
        'Content-Type': 'application/json'
      })
    const answerDeletedCustomer = await subscriptionService.chargeInvoice(testableInvoice!, actions)
    expect(stripeGetCustomersDeletedCustomer.isDone()).toBeTruthy()
    expect(stripePaymentIntentDeletedCustomer.isDone()).toBeTruthy()
    expect(answerDeletedCustomer.action?.daysAwayFromEnding).toEqual(999)
    expect(answerDeletedCustomer.action?.type).toEqual('RENEWAL_SUCCESS')
    expect(answerDeletedCustomer.action?.externalMailTemplate).toEqual('success-template')
    expect(answerDeletedCustomer.errorCode).toEqual('')
    const stripeGetCustomersNoDefault = await nock('https://api.stripe.com')
      .get('/v1/customers/stripeCustomerId')
      .replyWithFile(200, __dirname + '/__fixtures__/stripeGetCustomersNoDefault.json', {
        'Content-Type': 'application/json'
      })
    const stripePaymentIntentNoDefault = await nock('https://api.stripe.com', {
      encodedQueryParams: true
    })
      .post(
        '/v1/payment_intents',
        /amount=240&payment_method_types\[0\]=card&currency=chf&metadata\[paymentID\]=.*&metadata\[mail\]=test%40wepublish.com/g
      )
      .replyWithFile(200, __dirname + '/__fixtures__/stripePostPaymentIntentSuccess.json', {
        'Content-Type': 'application/json'
      })
    const answerNoDefault = await subscriptionService.chargeInvoice(testableInvoice!, actions)
    expect(answerNoDefault.action?.daysAwayFromEnding).toEqual(999)
    expect(answerNoDefault.action?.type).toEqual('RENEWAL_SUCCESS')
    expect(answerNoDefault.action?.externalMailTemplate).toEqual('success-template')
    expect(answerNoDefault.errorCode).toEqual('')
    expect(stripeGetCustomersNoDefault.isDone()).toBeTruthy()
    expect(stripePaymentIntentNoDefault.isDone()).toBeTruthy()

    const payments = await prismaClient.payment.findMany({
      where: {
        state: 'paid',
        intentID: 'pi_xxxxxxxxxxxxxxxxxxxx',
        intentSecret: 'pi_xxxxxxxxxxxxxxxxxxxx_secret_xxxxxxxxxxxxxxxxxxxx',
        paymentData: null
      }
    })
    expect(payments.length).toEqual(2)
  })

  it('Charge invoice: Stripe offsession payment card declined', async () => {
    const {testableInvoice, actions} = await createDataForChargeFunction()
    const stripeGetCustomers = await nock('https://api.stripe.com')
      .get('/v1/customers/stripeCustomerId')
      .replyWithFile(200, __dirname + '/__fixtures__/stripeGetCustomers.json', {
        'Content-Type': 'application/json'
      })
    const stripePaymentIntent = await nock('https://api.stripe.com', {encodedQueryParams: true})
      .post('/v1/payment_intents')
      .replyWithFile(402, __dirname + '/__fixtures__/stripePostPaymentIntentStripeCardError.json', {
        'Content-Type': 'application/json'
      })
    const answer = await subscriptionService.chargeInvoice(testableInvoice!, actions)
    expect(stripeGetCustomers.isDone()).toBeTruthy()
    expect(stripePaymentIntent.isDone()).toBeTruthy()
    expect(answer.action?.daysAwayFromEnding).toEqual(999)
    expect(answer.action?.type).toEqual('RENEWAL_FAILED')
    expect(answer.action?.externalMailTemplate).toEqual('failed-template')
    expect(answer.errorCode).toEqual('user-action-required')
    const payments = await prismaClient.payment.findMany({
      where: {
        state: 'submitted',
        intentID: 'unknown_error',
        intentSecret: '',
        paymentData: null
      }
    })
    expect(payments.length).toEqual(1)
  })

  it('Charge invoice: Stripe offsession successful', async () => {
    const {testableInvoice, actions} = await createDataForChargeFunction()
    const stripeGetCustomers = await nock('https://api.stripe.com')
      .get('/v1/customers/stripeCustomerId')
      .replyWithFile(200, __dirname + '/__fixtures__/stripeGetCustomers.json', {
        'Content-Type': 'application/json'
      })
    const stripePaymentIntent = await nock('https://api.stripe.com', {encodedQueryParams: true})
      .post('/v1/payment_intents')
      .replyWithFile(200, __dirname + '/__fixtures__/stripePostPaymentIntentSuccess.json', {
        'Content-Type': 'application/json'
      })
    const answer = await subscriptionService.chargeInvoice(testableInvoice!, actions)
    expect(stripeGetCustomers.isDone()).toBeTruthy()
    expect(stripePaymentIntent.isDone()).toBeTruthy()
    expect(answer.action?.daysAwayFromEnding).toEqual(999)
    expect(answer.action?.type).toEqual('RENEWAL_SUCCESS')
    expect(answer.action?.externalMailTemplate).toEqual('success-template')
    expect(answer.errorCode).toEqual('')

    const payments = await prismaClient.payment.findMany({})
    expect(payments.length).toEqual(1)
    expect(payments[0].state).toEqual('paid')
    expect(payments[0].intentID).toEqual('pi_xxxxxxxxxxxxxxxxxxxx')
    expect(payments[0].intentSecret).toEqual('pi_xxxxxxxxxxxxxxxxxxxx_secret_xxxxxxxxxxxxxxxxxxxx')
    expect(payments[0].paymentData).toBeNull()

    const subscription = await prismaClient.subscription.findUnique({
      where: {
        id: testableInvoice!.subscription!.id
      }
    })
    expect(subscription!.paidUntil).not.toBeNull()

    const invoice = await prismaClient.invoice.findUnique({
      where: {
        id: testableInvoice!.id
      }
    })
    expect(invoice!.paidAt).not.toBeNull()
  })

  it('Get period start and and if no previous period exist', async () => {
    const res = await subscriptionService['getNextPeriod']([], PaymentPeriodicity.monthly)
    expect(res.startsAt.getTime()).toBeGreaterThanOrEqual(
      add(new Date(), {minutes: -2, days: 1}).getTime()
    )
    expect(res.startsAt.getTime()).toBeLessThanOrEqual(add(new Date(), {days: 1}).getTime())
    expect(res.endsAt.getTime()).toBeGreaterThanOrEqual(
      add(new Date(), {minutes: -2, months: 1}).getTime()
    )
    expect(res.endsAt.getTime()).toBeLessThanOrEqual(add(new Date(), {months: 1}).getTime())
  })

  it('Offsession payment with canceled or already paid invoice', async () => {
    const date = new Date()
    try {
      await subscriptionService['offSessionPayment'](
        {canceledAt: date, paidAt: null} as any,
        {} as any,
        {} as any
      )
      throw Error('This execution should fail!')
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        `BadRequestException: Can not renew canceled invoice for subscription undefined`
      )
    }
    try {
      await subscriptionService['offSessionPayment'](
        {canceledAt: null, paidAt: date} as any,
        {} as any,
        {} as any
      )
      throw Error('This execution should fail!')
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        `BadRequestException: Can not renew paid invoice for subscription undefined`
      )
    }
    try {
      await subscriptionService['offSessionPayment'](
        {canceledAt: date, paidAt: date} as any,
        {} as any,
        {} as any
      )
      throw Error('This execution should fail!')
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        `BadRequestException: Can not renew paid invoice for subscription undefined`
      )
    }
  })

  it('Offsession payment invoice without subscription', async () => {
    try {
      const event: Action = {
        type: SubscriptionEvent.RENEWAL_SUCCESS,
        daysAwayFromEnding: 1,
        externalMailTemplate: null
      }
      await subscriptionService['offSessionPayment'](
        {canceledAt: null, paidAt: null} as any,
        {} as any,
        [event]
      )
      throw Error('This execution should fail!')
    } catch (e) {
      expect((e as Error).toString()).toEqual('NotFoundException: Subscription not found!')
    }
  })
})
