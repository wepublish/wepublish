import {Test, TestingModule} from '@nestjs/testing'
import nock from 'nock'
import {clearDatabase, clearFullDatabase} from '../../prisma-utils'
import {PrismaModule} from '@wepublish/nest-modules'
import {contextFromRequest, OldContextService, PrismaService} from '@wepublish/api'
import {PaymentPeriodicity, PrismaClient, SubscriptionEvent} from '@prisma/client'
import {PeriodicJobController} from './periodic-job.controller'
import {SubscriptionController} from '../subscription/subscription.controller'
import {matches} from 'lodash'
import {
  initialize,
  defineMemberPlanFactory,
  defineMailTemplateFactory,
  defineSubscriptionFlowFactory,
  definePaymentMethodFactory,
  defineUserFactory,
  defineSubscriptionIntervalFactory,
  defineInvoiceFactory,
  definePeriodicJobFactory
} from '@wepublish/api'
import {add, sub} from 'date-fns'
import {SubscriptionFlowController} from '../subscription-flow/subscription-flow.controller'
import {forwardRef} from '@nestjs/common'
import {initOldContextForTest} from '../../oldcontext-utils'
import {Action} from '../subscription-event-dictionary/subscription-event-dictionary.type'

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
  const PeriodicJobFactory = definePeriodicJobFactory()

  beforeAll(async () => {
    await clearFullDatabase(prismaClient)
  })

  beforeEach(async () => {
    await nock.disableNetConnect()
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
      'periodic_jobs',
      'subscriptions.deactivation-reasons'
    ])

    // Base data
    const payrexx = await PaymentMethodFactory.create({
      id: 'payrexx',
      name: 'payrexx',
      paymentProviderID: 'payrexx',
      slug: 'payrexx',
      active: true
    })
    const payrexxSubscription = await PaymentMethodFactory.create({
      id: 'payrexx-subscription',
      name: 'payrexx-subscription',
      paymentProviderID: 'payrexx-subscription',
      slug: 'payrexx-subscription',
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
    const customMessageMemberPlanNoMailTemplate = await MemberPlanFactory.create({
      name: 'customMessageMemberPlanNoMailTemplate',
      slug: 'customMessageMemberPlanNoMailTemplate'
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
        daysAwayFromEnding: -15
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
    await nock.cleanAll()
    await nock.enableNetConnect()
    await prismaClient.$disconnect()
  })

  it('is defined', () => {
    expect(controller).toBeDefined()
  })

  it('create invoice', async () => {
    const mandrillNockScope = await nock('https://mandrillapp.com:443')
      .post('/api/1.0/messages/send-template', matches({template_name: 'default-INVOICE_CREATION'}))
      .reply(500)
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
    if (!newInvoice) throw new Error('New Invoice not found!')
    expect(newInvoice.dueAt.getTime()).toBeGreaterThan(
      add(newInvoice.createdAt, {days: 12}).getTime()
    )
    expect(newInvoice.paymentDeadline!.getTime()).toBeGreaterThan(
      add(newInvoice.dueAt, {days: 4}).getTime()
    )
    expect(newInvoice.mail).toEqual(mail)
    expect(newInvoice.description).toEqual('yearly renewal of subscription yearly')
    expect(newInvoice.paidAt).toBeNull()
    expect(newInvoice.canceledAt).toBeNull()
    expect(newInvoice.manuallySetAsPaidByUserId).toBeNull()

    // Test invoice items
    expect(newInvoice.items.length).toEqual(1)
    const item = newInvoice.items[0]
    expect(item.name).toEqual('yearly')
    expect(item.description).toEqual('yearly renewal of subscription yearly')
    expect(item.quantity).toEqual(1)
    expect(item.amount).toEqual(2400)
    expect(item.invoiceId).not.toBeNull()

    // Test Periods
    expect(subscription.periods.length).toEqual(2)
    const newPeriod = subscription.periods.find(period => period.startsAt >= new Date())
    expect(newPeriod).toBeDefined()
    if (!newPeriod) throw new Error('New Period not found!')
    expect(newPeriod.startsAt.getTime()).toEqual(add(newInvoice.dueAt, {days: 1}).getTime())
    expect(newPeriod.endsAt.getTime()).toEqual(add(newInvoice.dueAt, {years: 1}).getTime())
    expect(newPeriod.paymentPeriodicity).toEqual('yearly')
    expect(newPeriod.amount).toEqual(2400)
    expect(newPeriod.subscriptionId).not.toBeNull()
    expect(newPeriod.invoiceID).not.toBeNull()

    expect(mandrillNockScope.isDone()).toBeTruthy()

    // Check that subscription is no canceled
    expect((await prismaClient.subscriptionDeactivation.findMany()).length).toEqual(0)
  })

  const generateInvoiceToCharge = async (
    renewalDate: Date,
    mail: string,
    paymentProviderID: string
  ) => {
    const invoice = await InvoiceFactory.create({
      dueAt: renewalDate,
      mail: mail,
      paymentDeadline: add(renewalDate, {days: 5}),
      items: {
        create: {
          amount: 2400,
          quantity: 1,
          name: 'Yearly Sub'
        }
      }
    })

    await UserFactory.create({
      email: mail,
      paymentProviderCustomers: {
        create: {
          paymentProviderID,
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
              id: paymentProviderID
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
              startsAt: renewalDate,
              endsAt: add(renewalDate, {months: 12}),
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
  }

  it('charge invoice offsession', async () => {
    const stripGetCustomers = await nock('https://api.stripe.com')
      .get('/v1/customers/testId')
      .replyWithFile(200, __dirname + '/__fixtures__/stripGetCustomers.json', {
        'Content-Type': 'application/json'
      })

    const stripPostPaymentIntent = await nock('https://api.stripe.com')
      .post('/v1/payment_intents')
      .replyWithFile(200, __dirname + '/__fixtures__/stripePostPaymentIntent.json', {
        'Content-Type': 'application/json'
      })
    const mandrillNockScope = await nock('https://mandrillapp.com:443')
      .post('/api/1.0/messages/send-template', matches({template_name: 'default-RENEWAL_SUCCESS'}))
      .reply(500)
    const mail = 'dev-mail@test.wepublish.com'
    const renewalDate = new Date()
    await generateInvoiceToCharge(renewalDate, mail, 'stripe')
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

    // Test subscription
    expect(paidInvoice.subscription).not.toBeNull()
    expect(paidInvoice.subscription!.paidUntil).not.toBeNull()
    expect(paidInvoice.subscription!.paidUntil!.getTime()).toEqual(
      add(renewalDate, {months: 12}).getTime()
    )

    // Test payment
    const payments = await prismaClient.payment.findMany({})
    expect(payments.length).toEqual(1)
    const payment = payments[0]
    expect(payment.state).toEqual('paid')
    expect(payment.intentID).toEqual('pi_xxxxxxxxxxxxxxxxxxxx')
    expect(payment.intentSecret).toEqual('pi_xxxxxxxxxxxxxxxxxxxx_secret_xxxxxxxxxxxxxxxxxxxx')
    expect(payment.intentData).not.toBeNull()

    expect(mandrillNockScope.isDone()).toBeTruthy()
    expect(stripGetCustomers.isDone()).toBeTruthy()
    expect(stripPostPaymentIntent.isDone()).toBeTruthy()

    // Check that subscription is no canceled
    expect((await prismaClient.subscriptionDeactivation.findMany()).length).toEqual(0)
  })

  it('charge invoice onsession', async () => {
    const mail = 'dev-mail@test.wepublish.com'
    const renewalDate = new Date()

    const mandrillNockScope = await nock('https://mandrillapp.com:443')
      .post('/api/1.0/messages/send-template')
      .reply(500)
    const stripGetCustomers = await nock('https://api.stripe.com')
      .get('/v1/customers/testId')
      .replyWithFile(200, __dirname + '/__fixtures__/stripGetCustomers.json', {
        'Content-Type': 'application/json'
      })

    const stripPostPaymentIntent = await nock('https://api.stripe.com')
      .post('/v1/payment_intents')
      .replyWithFile(200, __dirname + '/__fixtures__/stripePostPaymentIntent.json', {
        'Content-Type': 'application/json'
      })
    await generateInvoiceToCharge(renewalDate, mail, 'payrexx')
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
    expect(paidInvoice.paidAt).toBeNull()
    expect(paidInvoice.canceledAt).toBeNull()
    expect(paidInvoice.manuallySetAsPaidByUserId).toBeNull()

    // Test subscription
    expect(paidInvoice.subscription).not.toBeNull()
    expect(paidInvoice.subscription!.paidUntil).not.toBeNull()
    expect(paidInvoice.subscription!.paidUntil!.getTime()).toEqual(renewalDate.getTime())

    // Test payment
    const payments = await prismaClient.payment.findMany({})
    expect(payments.length).toEqual(0)

    expect(mandrillNockScope.isDone()).toBeFalsy()
    expect(stripGetCustomers.isDone()).toBeFalsy()
    expect(stripPostPaymentIntent.isDone()).toBeFalsy()

    // Check that subscription is no canceled
    expect((await prismaClient.subscriptionDeactivation.findMany()).length).toEqual(0)
  })

  it('disable subscription', async () => {
    const mandrillNockScopeFailedCharging = await nock('https://mandrillapp.com:443')
      .post('/api/1.0/messages/send-template', matches({template_name: 'default-RENEWAL_FAILED'}))
      .reply(500)

    const mandrillNockScopeDeactivationUnpaid = await nock('https://mandrillapp.com:443')
      .post(
        '/api/1.0/messages/send-template',
        matches({template_name: 'default-DEACTIVATION_UNPAID'})
      )
      .reply(500)
    const mail = 'dev-mail@test.wepublish.com'
    const renewalDate = sub(new Date(), {days: 1})
    const subscriptionValidUntil = sub(renewalDate, {days: 5})
    const invoice = await InvoiceFactory.create({
      dueAt: renewalDate,
      mail: mail,
      paymentDeadline: renewalDate,
      items: {
        create: {
          amount: 2400,
          quantity: 1,
          name: 'Yearly Sub'
        }
      }
    })

    await UserFactory.create({
      email: mail,
      Subscription: {
        create: {
          paymentPeriodicity: PaymentPeriodicity.yearly,
          paidUntil: subscriptionValidUntil,
          autoRenew: true,
          monthlyAmount: 200,
          startsAt: sub(subscriptionValidUntil, {months: 12}),
          paymentMethod: {
            connect: {
              id: 'payrexx-subscription'
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
              startsAt: subscriptionValidUntil,
              endsAt: add(subscriptionValidUntil, {months: 12}),
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
    const subscriptions = await prismaClient.subscription.findMany({
      include: {
        invoices: true,
        deactivation: true
      }
    })
    expect(subscriptions.length).toEqual(1)
    const updatedSubscription = subscriptions[0]
    expect(updatedSubscription).not.toBeNull()
    expect(updatedSubscription!.deactivation).not.toBeNull()
    expect(updatedSubscription!.deactivation!.reason).toEqual('invoiceNotPaid')
    expect(updatedSubscription!.invoices.length).toEqual(1)
    const updatedInvoice = updatedSubscription!.invoices[0]
    expect(updatedInvoice.paidAt).toBeNull()
    expect(updatedInvoice.canceledAt).not.toBeNull()
    expect(mandrillNockScopeFailedCharging.isDone()).toBeTruthy()
    expect(mandrillNockScopeDeactivationUnpaid.isDone()).toBeTruthy()
  })

  it('send custom email', async () => {
    const mandrillNockScopeCustomMessage = await nock('https://mandrillapp.com:443')
      .post('/api/1.0/messages/send-template', matches({template_name: 'default-CUSTOM1'}))
      .reply(500)

    const mail = 'dev-mail@test.wepublish.com'
    const renewalDate = add(new Date(), {days: 15})
    const invoice = await InvoiceFactory.create({
      dueAt: renewalDate,
      mail: mail,
      paymentDeadline: add(renewalDate, {days: 5}),
      items: {
        create: {
          amount: 2400,
          quantity: 1,
          name: 'Yearly Sub'
        }
      }
    })

    await UserFactory.create({
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
              id: 'payrexx-subscription'
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
    expect(mandrillNockScopeCustomMessage.isDone()).toBeTruthy()
  })

  it('Periodic after error rerun', async () => {
    const today = new Date()
    await PeriodicJobFactory.create({
      date: sub(today, {days: 1}),
      executionTime: sub(today, {days: 1}),
      finishedWithError: sub(today, {days: 1}),
      tries: 1,
      error: 'error Message'
    })
    await controller.execute()
    const periodicJobs = await prismaClient.periodicJob.findMany()
    expect(periodicJobs.length).toEqual(2)
    const retryJob = periodicJobs.find(pj => pj.error !== null)
    expect(retryJob).not.toBeNull()
    expect(retryJob!.tries).toEqual(2)
    expect(retryJob!.successfullyFinished).not.toBeNull()
    expect(retryJob!.finishedWithError).not.toBeNull()
    expect(retryJob!.error).not.toBeNull()

    const nextDayJob = periodicJobs.find(pj => pj.error === null)
    expect(nextDayJob).not.toBeNull()
    expect(nextDayJob!.tries).toEqual(1)
    expect(nextDayJob!.successfullyFinished).not.toBeNull()
    expect(nextDayJob!.finishedWithError).toBeNull()
    expect(nextDayJob!.error).toBeNull()
  })

  it('Test failing periodic job with recovery', async () => {
    const today = new Date()
    await PeriodicJobFactory.create({
      date: sub(today, {days: 1}),
      executionTime: sub(today, {days: 1}),
      successfullyFinished: sub(today, {days: 1}),
      tries: 1
    })

    const mail = 'dev-mail@test.wepublish.com'
    const renewalDate = add(new Date(), {days: 13})
    const invoice = await InvoiceFactory.create({
      dueAt: sub(renewalDate, {months: 12}),
      paidAt: sub(renewalDate, {months: 12}),
      mail: mail,
      paymentDeadline: sub(renewalDate, {months: 11, days: 20})
    })
    await UserFactory.create({
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

    await prismaClient.subscriptionInterval.deleteMany({
      where: {
        event: SubscriptionEvent.INVOICE_CREATION
      }
    })
    try {
      await controller.execute()
      throw Error('This execution should fail!')
    } catch (e) {
      expect((e as Error).toString()).toEqual('Error: No invoice creation date found!')
    }
    try {
      await controller.execute()
      throw Error('This execution should fail!')
    } catch (e) {
      expect((e as Error).toString()).toEqual('Error: No invoice creation date found!')
    }
    try {
      await controller.execute()
      throw Error('This execution should fail!')
    } catch (e) {
      expect((e as Error).toString()).toEqual('Error: No invoice creation date found!')
    }
    let periodicJobs = await prismaClient.periodicJob.findMany()
    expect(periodicJobs.length).toEqual(2)
    const failedJob = periodicJobs.find(pj => pj.tries === 3)
    expect(failedJob).not.toBeNull()
    expect(failedJob!.tries).toEqual(3)
    expect(failedJob!.successfullyFinished).toBeNull()
    expect(failedJob!.finishedWithError).not.toBeNull()
    expect(failedJob!.error).not.toBeNull()

    const defaultFlow = await prismaClient.subscriptionFlow.findFirst({
      where: {
        default: true
      }
    })

    await SubscriptionIntervalFactory.create({
      subscriptionFlow: {
        connect: {
          id: defaultFlow!.id
        }
      },
      event: SubscriptionEvent.INVOICE_CREATION,
      daysAwayFromEnding: -14,
      mailTemplate: {
        connect: {
          externalMailTemplateId: 'default-INVOICE_CREATION'
        }
      }
    })
    await controller.execute()
    periodicJobs = await prismaClient.periodicJob.findMany()
    expect(periodicJobs.length).toEqual(2)
    const retriedJob = periodicJobs.find(pj => pj.tries === 4)
    expect(retriedJob).not.toBeNull()
    expect(retriedJob!.tries).toEqual(4)
    expect(retriedJob!.successfullyFinished).not.toBeNull()
    expect(retriedJob!.finishedWithError).not.toBeNull()
    expect(retriedJob!.error).not.toBeNull()
    expect(retriedJob!.successfullyFinished!.getTime()).toBeGreaterThan(
      retriedJob!.finishedWithError!.getTime()
    )
  })
  it('Test Mail sending', async () => {
    const user = {}
    const action: Action = {
      type: SubscriptionEvent.INVOICE_CREATION,
      daysAwayFromEnding: 10,
      externalMailTemplate: 'template'
    }
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      await controller.sendTemplateMail(action, user, true, {})
    } catch (e) {
      1 + 2
      return
    }
    expect('should never get here').toEqual('was here')
  })

  it('Test Mail no template', async () => {
    const user = {}
    const action: Action = {
      type: SubscriptionEvent.INVOICE_CREATION,
      daysAwayFromEnding: 10,
      externalMailTemplate: null
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    await controller.sendTemplateMail(action, user, true, {})
  })

  it('Test Mail no user', async () => {
    const user = null
    const action: Action = {
      type: SubscriptionEvent.INVOICE_CREATION,
      daysAwayFromEnding: 10,
      externalMailTemplate: 'template'
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    await controller.sendTemplateMail(action, user, true, {})
  })
})
