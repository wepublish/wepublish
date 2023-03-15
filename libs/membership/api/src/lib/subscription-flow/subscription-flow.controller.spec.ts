import {Test, TestingModule} from '@nestjs/testing'
import {SubscriptionFlowController} from './subscription-flow.controller'
import {clearDatabase} from '../../prisma-utils'
import {PrismaModule} from '@wepublish/nest-modules'
import {OldContextService, PrismaService} from '@wepublish/api'
import {
  MailTemplate,
  MemberPlan,
  PaymentPeriodicity,
  PrismaClient,
  SubscriptionEvent,
  SubscriptionFlow
} from '@prisma/client'
import {PeriodicJobController} from '../periodic-job/periodic-job.controller'
import {SubscriptionController} from '../subscription/subscription.controller'

describe('SubscriptionFlowController', () => {
  let controller: SubscriptionFlowController
  const prismaClient = new PrismaClient()

  const createPlan = async (prismaClient: PrismaClient): Promise<MemberPlan> => {
    return prismaClient.memberPlan.create({
      data: {
        name: 'Test Plan',
        slug: 'test-plan-' + Math.random().toString(),
        tags: [],
        description: {},
        active: true,
        amountPerMonthMin: 1
      }
    })
  }

  const createTemplate = async (prismaClient: PrismaClient): Promise<MailTemplate> => {
    return prismaClient.mailTemplate.create({
      data: {
        name: 'Test Plan',
        externalMailTemplateId: Math.random().toString(),
        remoteMissing: false
      }
    })
  }

  const createFlow = async (
    prismaClient: PrismaClient,
    options: {
      isDefault?: boolean
      memberPlanId: string
      mailTemplateId: number
      periodicities?: PaymentPeriodicity[]
    }
  ): Promise<SubscriptionFlow> => {
    return prismaClient.subscriptionFlow.create({
      data: {
        default: options.isDefault || false,
        memberPlan: {connect: {id: options.memberPlanId}},
        paymentMethods: undefined,
        periodicities: options.periodicities || [],
        autoRenewal: [],
        intervals: {
          create: [
            {
              event: SubscriptionEvent.SUBSCRIBE,
              mailTemplate: {connect: {id: options.mailTemplateId}}
            },
            {
              event: SubscriptionEvent.RENEWAL_FAILED,
              mailTemplate: {connect: {id: options.mailTemplateId}}
            }
          ]
        }
      }
    })
  }

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
      'member.plans',
      'subscriptions.intervals',
      'mail_templates'
    ])
  })

  afterEach(async () => {
    await prismaClient.$disconnect()
  })

  it('is defined', () => {
    expect(controller).toBeDefined()
  })

  it('returns only default flow', async () => {
    const template = await createTemplate(prismaClient)
    const plan = await createPlan(prismaClient)
    const customFlow = await createFlow(prismaClient, {
      memberPlanId: plan.id,
      mailTemplateId: template.id
    })
    expect(customFlow.default).toEqual(false)
    const defaultFlow = await createFlow(prismaClient, {
      isDefault: true,
      memberPlanId: plan.id,
      mailTemplateId: template.id
    })

    const result = await controller.getFlows(true)
    expect(result.length).toEqual(1)
    expect(result[0].default).toEqual(true)
    expect(result[0].id).toEqual(defaultFlow.id)
  })

  it('returns all flows with default first', async () => {
    const template = await createTemplate(prismaClient)
    const plan = await createPlan(prismaClient)
    const customFlow = await createFlow(prismaClient, {
      memberPlanId: plan.id,
      mailTemplateId: template.id
    })
    expect(customFlow.default).toEqual(false)
    const defaultFlow = await createFlow(prismaClient, {
      isDefault: true,
      memberPlanId: plan.id,
      mailTemplateId: template.id
    })

    const result = await controller.getFlows(false)
    expect(result.length).toEqual(2)
    expect(result[0].default).toEqual(true)
    expect(result[0].id).toEqual(defaultFlow.id)
    expect(result[1].default).toEqual(false)
    expect(result[1].id).toEqual(customFlow.id)
  })

  it('creates a flow', async () => {
    const plan = await createPlan(prismaClient)

    await controller.createFlow({
      memberPlanId: plan.id,
      paymentMethodIds: ['aabbccdd'],
      periodicities: [PaymentPeriodicity.monthly],
      autoRenewal: [true]
    })

    const flows = await prismaClient.subscriptionFlow.findMany({include: {intervals: true}})
    expect(flows.length).toEqual(1)
    expect(flows[0].default).toEqual(false)
    expect(flows[0].memberPlanId).toEqual(plan.id)
    expect(flows[0].intervals.length).toEqual(0)
  })

  it('prevents creation of equal flows', async () => {
    const template = await createTemplate(prismaClient)
    const plan = await createPlan(prismaClient)
    const defaultFlow = await createFlow(prismaClient, {
      isDefault: true,
      memberPlanId: plan.id,
      mailTemplateId: template.id
    })

    await expect(
      controller.createFlow({
        memberPlanId: plan.id,
        paymentMethodIds: [],
        periodicities: [],
        autoRenewal: []
      })
    ).rejects.toThrowError()

    const flows = await prismaClient.subscriptionFlow.findMany()
    expect(flows.length).toEqual(1)
    expect(flows[0].default).toEqual(true)
    expect(flows[0].id).toEqual(defaultFlow.id)
  })

  it('prevents creation of flows with filter subset', async () => {
    const template = await createTemplate(prismaClient)
    const plan = await createPlan(prismaClient)
    const existingFlow = await createFlow(prismaClient, {
      memberPlanId: plan.id,
      periodicities: ['monthly', 'yearly'],
      mailTemplateId: template.id
    })

    await expect(
      controller.createFlow({
        memberPlanId: plan.id,
        paymentMethodIds: [],
        periodicities: ['monthly'],
        autoRenewal: []
      })
    ).rejects.toThrowError()

    const flows = await prismaClient.subscriptionFlow.findMany()
    expect(flows.length).toEqual(1)
    expect(flows[0].default).toEqual(false)
    expect(flows[0].id).toEqual(existingFlow.id)
  })

  it('allows creation of flows with different filters', async () => {
    const template = await createTemplate(prismaClient)
    const plan = await createPlan(prismaClient)
    const existingFlow = await createFlow(prismaClient, {
      memberPlanId: plan.id,
      periodicities: ['monthly'],
      mailTemplateId: template.id
    })

    await controller.createFlow({
      memberPlanId: plan.id,
      paymentMethodIds: [],
      periodicities: ['yearly'],
      autoRenewal: []
    })

    const flows = await prismaClient.subscriptionFlow.findMany()
    expect(flows.length).toEqual(2)
    expect(flows[0].default).toEqual(false)
    expect(flows[0].id).toEqual(existingFlow.id)
    expect(flows[1].default).toEqual(false)
    expect(flows[1].id).not.toEqual(existingFlow.id)
  })

  it('updates intervals of a flow', async () => {
    const template = await createTemplate(prismaClient)
    const plan = await createPlan(prismaClient)
    const flow = await createFlow(prismaClient, {
      memberPlanId: plan.id,
      mailTemplateId: template.id
    })
    const template2 = await createTemplate(prismaClient)

    const createdFlow = await prismaClient.subscriptionFlow.findFirst({
      where: {id: flow.id},
      include: {intervals: true}
    })
    const existingInterval = createdFlow?.intervals.find(
      i => i.event === SubscriptionEvent.SUBSCRIBE
    )
    expect(existingInterval?.mailTemplateId).toEqual(template.id)

    await controller.updateInterval({
      id: existingInterval!.id,
      mailTemplateId: template2.id
    })

    const updatedFlow = await prismaClient.subscriptionFlow.findFirst({
      where: {id: flow.id},
      include: {intervals: true}
    })
    const newInterval = updatedFlow?.intervals.find(i => i.event === SubscriptionEvent.SUBSCRIBE)
    expect(newInterval?.mailTemplateId).toEqual(template2.id)
  })
})
