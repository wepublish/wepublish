import {forwardRef} from '@nestjs/common'
import {Test, TestingModule} from '@nestjs/testing'
import {Currency, PaymentPeriodicity, PrismaClient, SubscriptionEvent, User} from '@prisma/client'
import {PrismaModule} from '@wepublish/nest-modules'
import {
  clearDatabase,
  clearFullDatabase,
  defineInvoiceFactory,
  defineMemberPlanFactory,
  definePaymentMethodFactory,
  definePeriodicJobFactory,
  defineSubscriptionFlowFactory,
  defineSubscriptionIntervalFactory,
  defineUserFactory,
  initialize
} from '@wepublish/testing'
import {add, startOfDay, sub} from 'date-fns'
import {matches} from 'lodash'
import nock from 'nock'
import {Action} from '../subscription-event-dictionary/subscription-event-dictionary.type'
import {SubscriptionFlowService} from '../subscription-flow/subscription-flow.service'
import {SubscriptionService} from '../subscription/subscription.service'
import {
  registerMailsModule,
  registerPaymentsModule,
  registerPrismaModule
} from '../testing/module-registrars'
import {PeriodicJobService} from './periodic-job.service'

describe('PeriodicJobService', () => {
  let service: PeriodicJobService
  const prismaClient = new PrismaClient()
  initialize({prisma: prismaClient})

  const MemberPlanFactory = defineMemberPlanFactory()
  const PaymentMethodFactory = definePaymentMethodFactory()
  const SubscriptionFlowFactory = defineSubscriptionFlowFactory({
    defaultData: {
      memberPlan: MemberPlanFactory,
      intervals: {connect: []}
    } as any
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
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PrismaModule,
        forwardRef(() => registerPrismaModule(prismaClient)),
        registerMailsModule(),
        registerPaymentsModule()
      ],
      providers: [SubscriptionFlowService, PeriodicJobService, SubscriptionService]
    }).compile()

    service = module.get<PeriodicJobService>(PeriodicJobService)

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
    await PaymentMethodFactory.create({
      id: 'payrexx',
      name: 'payrexx',
      paymentProviderID: 'payrexx',
      slug: 'payrexx',
      active: true
    })
    await PaymentMethodFactory.create({
      id: 'payrexx-subscription',
      name: 'payrexx-subscription',
      paymentProviderID: 'payrexx-subscription',
      slug: 'payrexx-subscription',
      active: true
    })

    await PaymentMethodFactory.create({
      id: 'stripe',
      name: 'stripe',
      paymentProviderID: 'stripe',
      slug: 'stripe',
      active: true
    })

    await MemberPlanFactory.create({
      name: 'yearly',
      slug: 'yearly'
    })
    await MemberPlanFactory.create({
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
    expect(service).toBeDefined()
  })

  it('create invoice', async () => {
    const mail = 'dev-mail@test.wepublish.com'
    const renewalDate = add(new Date(), {days: 13})
    const invoice = await InvoiceFactory.create({
      dueAt: sub(renewalDate, {months: 12}),
      paidAt: sub(renewalDate, {months: 12}),
      mail,
      scheduledDeactivationAt: sub(renewalDate, {months: 11, days: 20})
    })

    const testUserAndData = await UserFactory.create({
      email: mail,
      Subscription: {
        create: {
          currency: Currency.CHF,
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
    await service.execute()
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
    expect(newInvoice.scheduledDeactivationAt!.getTime()).toBeGreaterThan(
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

    const mailLogs = await prismaClient.mailLog.findMany()
    expect(mailLogs.length).toEqual(1)
    expect(mailLogs[0].mailIdentifier).toContain('INVOICE_CREATION')

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
      mail,
      scheduledDeactivationAt: add(renewalDate, {days: 5}),
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
          currency: Currency.CHF,
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
    const stripeGetCustomers = await nock('https://api.stripe.com')
      .get('/v1/customers/testId')
      .replyWithFile(200, __dirname + '/__fixtures__/stripeGetCustomers.json', {
        'Content-Type': 'application/json'
      })

    const stripPostPaymentIntent = await nock('https://api.stripe.com')
      .post('/v1/payment_intents')
      .replyWithFile(200, __dirname + '/__fixtures__/stripePostPaymentIntent.json', {
        'Content-Type': 'application/json'
      })
    const mail = 'dev-mail@test.wepublish.com'
    const renewalDate = new Date()
    await generateInvoiceToCharge(renewalDate, mail, 'stripe')
    await service.execute()
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

    const mailLogs = await prismaClient.mailLog.findMany()
    expect(mailLogs.length).toEqual(1)
    expect(mailLogs[0].mailIdentifier).toContain('RENEWAL_SUCCESS')

    expect(stripeGetCustomers.isDone()).toBeTruthy()
    expect(stripPostPaymentIntent.isDone()).toBeTruthy()

    // Check that subscription is no canceled
    expect((await prismaClient.subscriptionDeactivation.findMany()).length).toEqual(0)
  })

  it('charge invoice onsession', async () => {
    const mail = 'dev-mail@test.wepublish.com'
    const renewalDate = new Date()

    const mandrillNockScope = await nock('https://mandrillapp.com:443')
      .post('/api/1.0/messages/send-template')
      .replyWithFile(
        200,
        __dirname + '/__fixtures__/mailchimp-messages-send-success-response.json',
        {
          'Content-Type': 'application/json'
        }
      )
    const stripeGetCustomers = await nock('https://api.stripe.com')
      .get('/v1/customers/testId')
      .replyWithFile(200, __dirname + '/__fixtures__/stripeGetCustomers.json', {
        'Content-Type': 'application/json'
      })

    const stripPostPaymentIntent = await nock('https://api.stripe.com')
      .post('/v1/payment_intents')
      .replyWithFile(200, __dirname + '/__fixtures__/stripePostPaymentIntent.json', {
        'Content-Type': 'application/json'
      })
    await generateInvoiceToCharge(renewalDate, mail, 'payrexx')
    await service.execute()
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
    expect(stripeGetCustomers.isDone()).toBeFalsy()
    expect(stripPostPaymentIntent.isDone()).toBeFalsy()

    // Check that subscription is no canceled
    expect((await prismaClient.subscriptionDeactivation.findMany()).length).toEqual(0)
  })

  it('disable subscription', async () => {
    const mail = 'dev-mail@test.wepublish.com'
    const renewalDate = sub(new Date(), {days: 1})
    const subscriptionValidUntil = sub(renewalDate, {days: 5})
    const invoice = await InvoiceFactory.create({
      dueAt: renewalDate,
      mail,
      scheduledDeactivationAt: renewalDate,
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
          currency: Currency.CHF,
          paymentPeriodicity: PaymentPeriodicity.yearly,
          paidUntil: subscriptionValidUntil,
          autoRenew: true,
          monthlyAmount: 200,
          startsAt: sub(subscriptionValidUntil, {months: 12}),
          paymentMethod: {
            connect: {
              id: 'payrexx'
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
              startsAt: add(subscriptionValidUntil, {days: 10}),
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
    await service.execute()
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

    const mailLogs = await prismaClient.mailLog.findMany()
    expect(mailLogs.length).toEqual(1)
    expect(mailLogs[0].mailIdentifier).toContain('DEACTIVATION_UNPAID')
  })

  it('send custom email', async () => {
    const mail = 'dev-mail@test.wepublish.com'
    const renewalDate = add(new Date(), {days: 15})
    const invoice = await InvoiceFactory.create({
      dueAt: renewalDate,
      mail,
      scheduledDeactivationAt: add(renewalDate, {days: 5}),
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
          currency: Currency.CHF,
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
    await service.execute()

    const mailLogs = await prismaClient.mailLog.findMany()
    expect(mailLogs.length).toEqual(1)
    expect(mailLogs[0].mailIdentifier).toContain('CUSTOM1')
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
    await service.execute()
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

    await nock('https://mandrillapp.com:443')
      .post('/api/1.0/messages/send-template', matches({template_name: 'default-INVOICE_CREATION'}))
      .replyWithFile(
        200,
        __dirname + '/__fixtures__/mailchimp-messages-send-success-response.json',
        {
          'Content-Type': 'application/json'
        }
      )
    const mail = 'dev-mail@test.wepublish.com'
    const renewalDate = add(new Date(), {days: 13})
    const invoice = await InvoiceFactory.create({
      dueAt: sub(renewalDate, {months: 12}),
      paidAt: sub(renewalDate, {months: 12}),
      mail,
      scheduledDeactivationAt: sub(renewalDate, {months: 11, days: 20})
    })
    await UserFactory.create({
      email: mail,
      Subscription: {
        create: {
          currency: Currency.CHF,
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
      await service.execute()
      fail()
    } catch (e) {
      expect((e as Error).toString()).toContain(
        'NotFoundException: No invoice creation date found!'
      )
    }

    try {
      await service.execute()
      fail()
    } catch (e) {
      expect((e as Error).toString()).toContain(
        'NotFoundException: No invoice creation date found!'
      )
    }

    try {
      await service.execute()
      fail()
    } catch (e) {
      expect((e as Error).toString()).toContain(
        'NotFoundException: No invoice creation date found!'
      )
    }

    let periodicJobs = await prismaClient.periodicJob.findMany()
    const failedJob = periodicJobs.find(pj => pj.tries === 3)

    expect(periodicJobs.length).toEqual(2)
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

    await service.execute()

    periodicJobs = await prismaClient.periodicJob.findMany()
    const retriedJob = periodicJobs.find(pj => pj.tries === 4)

    expect(periodicJobs.length).toEqual(2)
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const user: User = {}
    const action: Action = {
      type: SubscriptionEvent.INVOICE_CREATION,
      daysAwayFromEnding: 10,
      externalMailTemplate: 'template'
    }
    try {
      await service['sendTemplateMail'](action, user, true, {}, new Date())
    } catch (e) {
      1 + 2
      return
    }
    expect('should never get here').toEqual('was here')
  })

  it('Test Mail no template', async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const user: User = {}
    const action: Action = {
      type: SubscriptionEvent.INVOICE_CREATION,
      daysAwayFromEnding: 10,
      externalMailTemplate: null
    }

    await service['sendTemplateMail'](action, user, true, {}, new Date())
  })

  it('Test Mail no user', async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const user: User = null
    const action: Action = {
      type: SubscriptionEvent.INVOICE_CREATION,
      daysAwayFromEnding: 10,
      externalMailTemplate: 'template'
    }
    await service['sendTemplateMail'](action, user, true, {}, new Date())
  })

  it('Get outstanding runs on first run', async () => {
    const runs = await service['getOutstandingRuns'](new Date())
    expect(runs.length).toEqual(1)
    expect(runs[0].isRetry).toBeFalsy()
    expect(runs[0].date.getTime()).toEqual(startOfDay(new Date()).getTime())
  })

  it('Get outstanding runs if for one week not run', async () => {
    await PeriodicJobFactory.create({
      date: sub(new Date(), {days: 7}),
      successfullyFinished: sub(new Date(), {days: 7}),
      tries: 1
    })
    const runs = await service['getOutstandingRuns'](new Date())

    expect(runs.length).toEqual(7)
    for (const runCtr in runs) {
      expect(runs[runCtr].isRetry).toBeFalsy()
      expect(runs[runCtr].date.getTime()).toEqual(
        startOfDay(sub(new Date(), {days: 6 - parseInt(runCtr)})).getTime()
      )
    }
  })

  it('Get outstanding runs with last run has failed', async () => {
    await PeriodicJobFactory.create({
      date: sub(new Date(), {days: 3}),
      finishedWithError: sub(new Date(), {days: 3}),
      tries: 1
    })
    const runs = await service['getOutstandingRuns'](new Date())
    expect(runs.length).toEqual(4)
    const retryRun = runs.shift()
    expect(retryRun!.isRetry).toBeTruthy()
    expect(retryRun!.date).toEqual(startOfDay(sub(new Date(), {days: 3})))
    for (const runCtr in runs) {
      expect(runs[runCtr].isRetry).toBeFalsy()
      expect(runs[runCtr].date.getTime()).toEqual(
        startOfDay(sub(new Date(), {days: 2 - parseInt(runCtr)})).getTime()
      )
    }
  })

  it('Concurrent periodic job run protection', async () => {
    const runs = await service['getOutstandingRuns'](new Date())
    expect(await service['isAlreadyAJobRunning']()).toBeFalsy()
    await service['markJobStarted'](runs[0].date)
    expect(await service['isAlreadyAJobRunning']()).toBeTruthy()
    await service['markJobFailed']('Failed with X')
    expect(await service['isAlreadyAJobRunning']()).toBeTruthy()
    await prismaClient.periodicJob.updateMany({
      where: {},
      data: {
        executionTime: sub(new Date(), {hours: 2})
      }
    })
    expect(await service['isAlreadyAJobRunning']()).toBeFalsy()
    await service['retryFailedJob'](runs[0].date)
    expect(await service['isAlreadyAJobRunning']()).toBeTruthy()
    await service['markJobSuccessful']()
    expect(await service['isAlreadyAJobRunning']()).toBeTruthy()
  })

  it('random timeout for concurrent execution of periodic job', async () => {
    service['randomNumberRangeForConcurrency'] = 500
    const timeout = await service['sleepForRandomIntervalToEnsureConcurrency']()
    expect(timeout).toBeLessThanOrEqual(500)
    expect(timeout).toBeGreaterThanOrEqual(0)
  })

  it('Concurrent execute', async () => {
    service['randomNumberRangeForConcurrency'] = 500
    await service.concurrentExecute()
    const pj = await prismaClient.periodicJob.findMany({})
    expect(pj.length).toEqual(1)
  })

  it('Concurrent execute with already running process', async () => {
    service['randomNumberRangeForConcurrency'] = 500
    await PeriodicJobFactory.create({
      executionTime: new Date()
    })
    await service.concurrentExecute()
    const pj = await prismaClient.periodicJob.findMany({})
    expect(pj.length).toEqual(1)
  })

  it('Mark job as successful while now job runs', async () => {
    try {
      await service['markJobSuccessful']()
      fail()
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        'Error: Try to make a job as successful while none is running!'
      )
    }
  })

  it('Mark job as failed while now job runs', async () => {
    try {
      await service['markJobFailed']('error')
      fail()
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        'Error: Try to make a job as failed while none is running!'
      )
    }
  })

  it('Invoice creation missing invoice creation or invoice deletion object', async () => {
    const mp = await MemberPlanFactory.create({})
    const pm = await PaymentMethodFactory.create({})
    const sf = await SubscriptionFlowFactory.create({
      default: false,
      memberPlan: {
        connect: {
          id: mp.id
        }
      },
      paymentMethods: {
        connect: {
          id: pm.id
        }
      },
      autoRenewal: [true],
      periodicities: [PaymentPeriodicity.biannual]
    })
    const runDate = startOfDay(new Date())
    const pjo: any = {
      date: runDate
    }
    const invoice: any = {
      memberPlanID: mp.id,
      paymentMethodID: pm.id,
      autoRenew: true,
      paymentPeriodicity: PaymentPeriodicity.biannual
    }
    try {
      await service['createInvoice'](pjo, invoice)
      fail()
    } catch (e) {
      expect((e as Error).toString()).toEqual('NotFoundException: No invoice creation found!')
    }
    await SubscriptionIntervalFactory.create({
      subscriptionFlow: {
        connect: {
          id: sf.id
        }
      },
      daysAwayFromEnding: -10,
      event: SubscriptionEvent.INVOICE_CREATION
    })
    try {
      await service['createInvoice'](pjo, invoice)
      fail()
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        'NotFoundException: No invoice deactivation event found!'
      )
    }
    await SubscriptionIntervalFactory.create({
      subscriptionFlow: {
        connect: {
          id: sf.id
        }
      },
      event: SubscriptionEvent.DEACTIVATION_UNPAID
    })
    invoice.paidUntil = add(runDate, {days: 11})
    await service['createInvoice'](pjo, invoice)
    try {
      invoice.paidUntil = add(runDate, {days: 10, seconds: -10})
      await service['createInvoice'](pjo, invoice)
      fail()
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        "TypeError: Cannot read properties of undefined (reading 'name')"
      )
    }
    try {
      invoice.paidUntil = add(runDate, {days: 9})
      await service['createInvoice'](pjo, invoice)
      fail()
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        "TypeError: Cannot read properties of undefined (reading 'name')"
      )
    }
  })

  it('Charge Invoice missing subscription', async () => {
    const pjo: any = {}
    const invoice: any = {}
    try {
      await service['chargeInvoice'](pjo, invoice)
      fail()
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        'Error: Invoice undefined has no subscription assigned!'
      )
    }
  })

  it('Deactivate subscription missing invoice deletion object', async () => {
    const mp = await MemberPlanFactory.create({})
    const pm = await PaymentMethodFactory.create({})
    await SubscriptionFlowFactory.create({
      default: false,
      memberPlan: {
        connect: {
          id: mp.id
        }
      },
      paymentMethods: {
        connect: {
          id: pm.id
        }
      },
      autoRenewal: [true],
      periodicities: [PaymentPeriodicity.biannual]
    })
    const runDate = startOfDay(new Date())
    const pjo: any = {
      date: runDate
    }
    const invoice: any = {
      id: 100
    }
    try {
      await service['deactivateSubscription'](pjo, invoice)
      fail()
    } catch (e) {
      expect((e as Error).toString()).toMatchInlineSnapshot(
        `"BadRequestException: Invoice 100 has no subscription assigned!"`
      )
    }
    invoice.subscription = {
      memberPlanID: mp.id,
      paymentMethodID: pm.id,
      autoRenew: true,
      paymentPeriodicity: PaymentPeriodicity.biannual
    }
    try {
      await service['deactivateSubscription'](pjo, invoice)
      fail()
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        'NotFoundException: No subscription deactivation found!'
      )
    }
  })

  it('loads time in same timezone as it was stored', async () => {
    const date = new Date()
    date.setHours(1)

    await prismaClient.periodicJob.create({
      data: {
        date
      }
    })

    const pj = await prismaClient.periodicJob.findMany()
    const date2 = new Date(date.getTime())
    date2.setHours(0)
    date2.setMinutes(0)
    date2.setSeconds(0)
    date2.setMilliseconds(0)
    expect(pj[0].date).toEqual(date2)
  })
})
