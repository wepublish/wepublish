import {Test, TestingModule} from '@nestjs/testing'
import {SubscriptionFlowController} from './subscription-flow.controller'
import {clearDatabase} from '../../prisma-utils'
import {PrismaModule} from '@wepublish/nest-modules'
import {PrismaClient} from '@prisma/client'
import {PeriodicJobController} from '../periodic-job/periodic-job.controller'
import {SubscriptionController} from '../subscription/subscription.controller'
import {
  initialize,
  defineMemberPlanFactory,
  defineMailTemplateFactory,
  defineSubscriptionFlowFactory,
  defineSubscriptionIntervalFactory
} from '../../__generated__/fabbrica'
import {registerMailsModule, registerPaymentsModule} from '../testing/module-registrars'

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
    } as any
  })
  const SubscriptionIntervalFactory = defineSubscriptionIntervalFactory({
    defaultData: {
      subscriptionFlow: SubscriptionFlowFactory
    }
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PrismaModule.forTest(prismaClient),
        registerMailsModule(),
        registerPaymentsModule()
      ],
      providers: [SubscriptionFlowController, PeriodicJobController, SubscriptionController]
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
    const flow1 = await SubscriptionFlowFactory.create({
      intervals: {connect: [{id: interval.id}]}
    })

    const flow = await prismaClient.subscriptionFlow.findFirst({
      where: {id: flow1.id},
      include: {intervals: {include: {mailTemplate: true}}}
    })

    expect(flow!.intervals[0].mailTemplate?.id).toBe(template.id)
  })
})
