import {Test, TestingModule} from '@nestjs/testing'
import nock from 'nock'
import {clearDatabase} from '../../prisma-utils'
import {PrismaModule} from '@wepublish/nest-modules'
import {contextFromRequest, OldContextService, PrismaService} from '@wepublish/api'
import {PaymentPeriodicity, PrismaClient, SubscriptionEvent} from '@prisma/client'
import {PeriodicJobController} from './periodic-job.controller'
import {SubscriptionController} from '../subscription/subscription.controller'
import {
  initialize,
  defineMemberPlanFactory,
  defineMailTemplateFactory,
  defineSubscriptionFlowFactory,
  definePaymentMethodFactory,
  defineUserFactory,
  defineSubscriptionIntervalFactory,
  defineInvoiceFactory
} from '@wepublish/api'
import {add, sub} from 'date-fns'
import {SubscriptionFlowController} from '../subscription-flow/subscription-flow.controller'
import {forwardRef} from '@nestjs/common'
import {initOldContextForTest} from '../../oldcontext-utils'

describe('PeriodicJobController', () => {
  let controller: PeriodicJobController
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

  let stripGetCustomers: nock.Scope
  let stripPostPaymentIntent: nock.Scope

  beforeAll(() => {
    // nock.recorder.rec()
    stripGetCustomers = nock('https://api.stripe.com')
      .persist()
      .get('/v1/customers/testId')
      .replyWithFile(200, __dirname + '/__fixtures__/stripGetCustomers.json', {
        'Content-Type': 'application/json'
      })

    stripPostPaymentIntent = nock('https://api.stripe.com')
      .persist()
      .post('/v1/payment_intents')
      .replyWithFile(200, __dirname + '/__fixtures__/stripePostPaymentIntent.json', {
        'Content-Type': 'application/json'
      })
    /**
    stripPostPaymentIntent.on('replied', () => {
      nock.recorder.rec()
    })**/
    nock.disableNetConnect()
  })

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

    controller = module.get<PeriodicJobController>(PeriodicJobController)

    await clearDatabase(prismaClient, [
      'subscription_communication_flows',
      'payment.methods',
      'member.plans',
      'subscriptions.intervals',
      'mail_templates',
      'subscriptions',
      'invoices',
      'payments',
      'users',
      'users.payment-providers',
      'periodic_jobs'
    ])

    // Base data
    const payrexx = await PaymentMethodFactory.create({
      id: 'payrexx',
      name: 'payrexx',
      paymentProviderID: 'payrexx',
      slug: 'payrexx',
      active: true
    })

    const stripe = await PaymentMethodFactory.create({
      id: 'stripe',
      name: 'stripe',
      paymentProviderID: 'stripe',
      slug: 'stripe',
      active: true
    })

    const yearlyMemberPlan = await MemberPlanFactory.create({
      name: 'yearly',
      slug: 'yearly'
    })

    const defaultFlow = await SubscriptionFlowFactory.create({
      default: true,
      memberPlan: {},
      autoRenewal: [],
      periodicities: [],
      paymentMethods: {}
    })

    const subscriptionFLowIntervals = [
      // Default SubscriptionFlow
      {
        subscriptionFlowId: defaultFlow.id,
        mailTemplateName: 'default-SUBSCRIBE',
        event: SubscriptionEvent.SUBSCRIBE,
        daysAwayFromEnding: null
      },
      {
        subscriptionFlowId: defaultFlow.id,
        mailTemplateName: 'default-RENEWAL_SUCCESS',
        event: SubscriptionEvent.RENEWAL_SUCCESS,
        daysAwayFromEnding: null
      },
      {
        subscriptionFlowId: defaultFlow.id,
        mailTemplateName: 'default-RENEWAL_FAILED',
        event: SubscriptionEvent.RENEWAL_FAILED,
        daysAwayFromEnding: null
      },
      {
        subscriptionFlowId: defaultFlow.id,
        mailTemplateName: 'default-INVOICE_CREATION',
        event: SubscriptionEvent.INVOICE_CREATION,
        daysAwayFromEnding: -14
      },
      {
        subscriptionFlowId: defaultFlow.id,
        mailTemplateName: 'default-DEACTIVATION_UNPAID',
        event: SubscriptionEvent.DEACTIVATION_UNPAID,
        daysAwayFromEnding: 5
      },
      {
        subscriptionFlowId: defaultFlow.id,
        mailTemplateName: 'default-DEACTIVATION_BY_USER',
        event: SubscriptionEvent.DEACTIVATION_BY_USER,
        daysAwayFromEnding: null
      },
      {
        subscriptionFlowId: defaultFlow.id,
        mailTemplateName: 'default-REACTIVATION',
        event: SubscriptionEvent.REACTIVATION,
        daysAwayFromEnding: null
      },
      {
        subscriptionFlowId: defaultFlow.id,
        mailTemplateName: 'default-CUSTOM1',
        event: SubscriptionEvent.CUSTOM,
        daysAwayFromEnding: 15
      }
    ]

    for (const sfi of subscriptionFLowIntervals) {
      await SubscriptionIntervalFactory.create({
        subscriptionFlow: {
          connect: {
            id: sfi.subscriptionFlowId
          }
        },
        event: sfi.event,
        daysAwayFromEnding: sfi.daysAwayFromEnding,
        mailTemplate: {
          create: {
            externalMailTemplateId: sfi.mailTemplateName,
            name: sfi.mailTemplateName
          }
        }
      })
    }
  })

  afterEach(async () => {
    await prismaClient.$disconnect()
  })

  it('is defined', () => {
    expect(controller).toBeDefined()
  })

  it('create invoice', async () => {
    const mail = 'dev-mail@test.wepublish.com'
    const renewalDate = add(new Date(), {days: 13})
    const invoice = await InvoiceFactory.create({
      dueAt: sub(renewalDate, {months: 12}),
      paidAt: sub(renewalDate, {months: 12}),
      mail: mail,
      paymentDeadline: sub(renewalDate, {months: 11, days: 20})
    })

    const testUserAndData = await UserFactory.create({
      email: mail,
      Subscription: {
        create: {
          paymentPeriodicity: PaymentPeriodicity.yearly,
          paidUntil: renewalDate,
          autoRenew: true,
          monthlyAmount: 200,
          startsAt: sub(renewalDate, {months: 12}),
          paymentMethod: {
            connect: {
              id: 'stripe'
            }
          },
          memberPlan: {
            connect: {
              slug: 'yearly'
            }
          },
          invoices: {
            connect: {
              id: invoice.id
            }
          },
          periods: {
            create: {
              startsAt: sub(renewalDate, {months: 12}),
              endsAt: renewalDate,
              paymentPeriodicity: PaymentPeriodicity.yearly,
              amount: 2300,
              invoice: {
                connect: {
                  id: invoice.id
                }
              }
            }
          }
        }
      }
    })
    await controller.execute()
    const subscriptions = await prismaClient.subscription.findMany({
      where: {
        userID: testUserAndData.id
      },
      include: {
        deactivation: true,
        invoices: {
          include: {
            items: true
          }
        },
        periods: true
      }
    })

    // Test subscription
    expect(subscriptions.length).toEqual(1)
    const subscription = subscriptions[0]
    expect(subscription.invoices.length).toEqual(2)

    // Test new created invoice
    const newInvoice = subscription.invoices.find(invoice => invoice.dueAt >= new Date())
    expect(newInvoice).toBeDefined()
    if (!newInvoice) throw Error('New Invoice not found!')
    expect(newInvoice.dueAt.getTime()).toBeGreaterThan(
      add(newInvoice.createdAt, {days: 12}).getTime()
    )
    expect(newInvoice.paymentDeadline!.getTime()).toBeGreaterThan(
      add(newInvoice.dueAt, {days: 4}).getTime()
    )
    expect(newInvoice.mail).toEqual(mail)
    expect(newInvoice.description).toEqual('Renewal of subscription yearly for yearly')
    expect(newInvoice.paidAt).toBeNull()
    expect(newInvoice.canceledAt).toBeNull()
    expect(newInvoice.manuallySetAsPaidByUserId).toBeNull()

    // Test invoice items
    expect(newInvoice.items.length).toEqual(1)
    const item = newInvoice.items[0]
    expect(item.name).toEqual('yearly')
    expect(item.description).toEqual('Renewal of subscription yearly for yearly')
    expect(item.quantity).toEqual(1)
    expect(item.amount).toEqual(2400)
    expect(item.invoiceId).not.toBeNull()

    // Test Periods
    expect(subscription.periods.length).toEqual(2)
    const newPeriod = subscription.periods.find(period => period.startsAt >= new Date())
    expect(newPeriod).toBeDefined()
    if (!newPeriod) throw Error('New Period not found!')
    expect(newPeriod.startsAt.getTime()).toEqual(add(newInvoice.dueAt, {days: 1}).getTime())
    expect(newPeriod.endsAt.getTime()).toEqual(add(newInvoice.dueAt, {years: 1}).getTime())
    expect(newPeriod.paymentPeriodicity).toEqual('yearly')
    expect(newPeriod.amount).toEqual(2400)
    expect(newPeriod.subscriptionId).not.toBeNull()
    expect(newPeriod.invoiceID).not.toBeNull()

    // Check that subscription is no canceled
    expect((await prismaClient.subscriptionDeactivation.findMany()).length).toEqual(0)
  })

  it('charge invoice', async () => {
    const mail = 'dev-mail@test.wepublish.com'
    const renewalDate = new Date()
    const invoice = await InvoiceFactory.create({
      dueAt: renewalDate,
      mail: mail,
      paymentDeadline: sub(renewalDate, {months: 11, days: 20}),
      items: {
        create: {
          amount: 2400,
          quantity: 1,
          name: 'Yearly Sub'
        }
      }
    })

    const testUserAndData = await UserFactory.create({
      email: mail,
      paymentProviderCustomers: {
        create: {
          paymentProviderID: 'stripe',
          customerID: 'testId'
        }
      },
      Subscription: {
        create: {
          paymentPeriodicity: PaymentPeriodicity.yearly,
          paidUntil: renewalDate,
          autoRenew: true,
          monthlyAmount: 200,
          startsAt: sub(renewalDate, {months: 12}),
          paymentMethod: {
            connect: {
              id: 'stripe'
            }
          },
          memberPlan: {
            connect: {
              slug: 'yearly'
            }
          },
          invoices: {
            connect: {
              id: invoice.id
            }
          },
          periods: {
            create: {
              startsAt: sub(renewalDate, {months: 12}),
              endsAt: renewalDate,
              paymentPeriodicity: PaymentPeriodicity.yearly,
              amount: 2400,
              invoice: {
                connect: {
                  id: invoice.id
                }
              }
            }
          }
        }
      }
    })
    await controller.execute()
    const invoices = await prismaClient.invoice.findMany({
      include: {
        subscription: true,
        subscriptionPeriods: true
      }
    })

    // Test invoice
    expect(invoices.length).toEqual(1)
    const paidInvoice = invoices[0]
    expect(paidInvoice.mail).toEqual(mail)
    expect(paidInvoice.paidAt).not.toBeNull()
    expect(paidInvoice.canceledAt).toBeNull()
    expect(paidInvoice.manuallySetAsPaidByUserId).toBeNull()

    // Test payment
    const payments = await prismaClient.payment.findMany({})
    expect(payments.length).toEqual(1)
    const payment = payments[0]
    expect(payment.state).toEqual('paid')
    expect(payment.intentID).toEqual('pi_xxxxxxxxxxxxxxxxxxxx')
    expect(payment.intentSecret).toEqual('pi_xxxxxxxxxxxxxxxxxxxx_secret_xxxxxxxxxxxxxxxxxxxx')
    expect(payment.intentData).not.toBeNull()

    // Check that subscription is no canceled
    expect((await prismaClient.subscriptionDeactivation.findMany()).length).toEqual(0)
  })
})
