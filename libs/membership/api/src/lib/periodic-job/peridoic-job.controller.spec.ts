import {Test, TestingModule} from '@nestjs/testing'
import nock from 'nock'
import {clearDatabase} from '../../prisma-utils'
import {PrismaModule} from '@wepublish/nest-modules'
import {OldContextService, PrismaService} from '@wepublish/api'
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
  defineSubscriptionIntervalFactory
} from '@wepublish/api'
import {add, sub} from 'date-fns'
import {SubscriptionFlowController} from '../subscription-flow/subscription-flow.controller'
import {forwardRef} from '@nestjs/common'

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
  const SubscriptionIntervalFactory = defineSubscriptionIntervalFactory({
    defaultData: {
      subscriptionFlow: SubscriptionFlowFactory
    }
  })
  beforeAll(() => {
    nock.disableNetConnect()
    nock.recorder.rec()
  })

  beforeEach(async () => {
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
    const renewalDate = add(new Date(), {days: 13})
    await UserFactory.create({
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
          periods: {
            create: {
              startsAt: sub(renewalDate, {months: 12}),
              endsAt: renewalDate,
              paymentPeriodicity: PaymentPeriodicity.yearly,
              amount: 2400,
              invoice: {
                create: {
                  dueAt: sub(renewalDate, {months: 12}),
                  mail: 'dev-mail@test.wepublish.com'
                }
              }
            }
          }
        }
      }
    })
  })
})
