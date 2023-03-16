import {Test, TestingModule} from '@nestjs/testing'
import {SubscriptionFlowController} from './subscription-flow.controller'
import {clearDatabase} from '../../prisma-utils'
import {PrismaModule} from '@wepublish/nest-modules'
import {OldContextService, PrismaService} from '@wepublish/api'
import {PaymentPeriodicity, PrismaClient, SubscriptionEvent} from '@prisma/client'
import {PeriodicJobController} from '../periodic-job/periodic-job.controller'
import {SubscriptionController} from '../subscription/subscription.controller'
import {
  initialize,
  defineMemberPlanFactory,
  defineMailTemplateFactory,
  defineSubscriptionFlowFactory,
  defineSubscriptionIntervalFactory,
  definePaymentMethodFactory
} from '../../../../../api/src/__generated__/fabbrica'

describe('SubscriptionFlowController', () => {
  let controller: SubscriptionFlowController
  const prismaClient = new PrismaClient()
  initialize({prisma: prismaClient})

  const MemberPlanFactory = defineMemberPlanFactory()
  const MailTemplateFactory = defineMailTemplateFactory()
  const SubscriptionFlowFactory = defineSubscriptionFlowFactory({
    defaultData: {
      memberPlan: MemberPlanFactory,
      intervals: {connect: []}
    }
  })
  const SubscriptionIntervalFactory = defineSubscriptionIntervalFactory()

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule.forTest(prismaClient)],
      providers: [
        PrismaService,
        SubscriptionFlowController,
        PeriodicJobController,
        OldContextService,
        SubscriptionController
      ]
    }).compile()

    controller = module.get<SubscriptionFlowController>(SubscriptionFlowController)

    await clearDatabase(prismaClient, [
      'subscription_communication_flows',
      'payment.methods',
      'member.plans',
      'subscriptions.intervals',
      'mail_templates'
    ])
  })

  afterEach(async () => {
    await prismaClient.$disconnect()
  })

  test('can create default SCF with subscriptionMail and subscriptionInterval', async () => {
    const template = await MailTemplateFactory.create()
    const interval = await SubscriptionIntervalFactory.create({
      mailTemplate: {connect: {id: template.id}}
    })
    await SubscriptionFlowFactory.create({
      intervals: {connect: [{id: interval.id}]}
    })

    const flow = await prismaClient.subscriptionFlow.findFirst({
      include: {intervals: {include: {mailTemplate: true}}}
    })

    expect(flow!.intervals[0].mailTemplate).toBe(template.id)
  })
})
