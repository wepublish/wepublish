import {Test, TestingModule} from '@nestjs/testing'
import {SubscriptionFlowController} from './subscription-flow.controller'
import {clearDatabase} from '../../prisma-utils'
import {PrismaModule} from '@wepublish/nest-modules'
import {PrismaService} from '@wepublish/api'
import {
  MailTemplate,
  MemberPlan,
  PaymentPeriodicity,
  PrismaClient,
  SubscriptionFlow
} from '@prisma/client'

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
        subscribeMailTemplate: {connect: {id: options.mailTemplateId}},
        renewalFailedMailTemplate: {connect: {id: options.mailTemplateId}}
      }
    })
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule.forTest(prismaClient)],
      providers: [PrismaService, SubscriptionFlowController]
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

    const result = await controller.getFlow(true)
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

    const result = await controller.getFlow(false)
    expect(result.length).toEqual(2)
    expect(result[0].default).toEqual(true)
    expect(result[0].id).toEqual(defaultFlow.id)
    expect(result[1].default).toEqual(false)
    expect(result[1].id).toEqual(customFlow.id)
  })

  it('creates a flow', async () => {
    const template = await createTemplate(prismaClient)
    const plan = await createPlan(prismaClient)

    await controller.createFlow({
      memberPlan: {id: plan.id},
      paymentMethods: [],
      periodicities: [],
      autoRenewal: [],
      subscribeMailTemplate: {id: template.id},
      invoiceCreationMailTemplate: {daysAwayFromEnding: 3, mailTemplate: {id: template.id}},
      renewalSuccessMailTemplate: {id: template.id},
      renewalFailedMailTemplate: {id: template.id},
      deactivationUnpaidMailTemplate: {daysAwayFromEnding: 3, mailTemplate: {id: template.id}},
      deactivationByUserMailTemplate: {id: template.id},
      reactivationMailTemplate: {id: template.id},
      additionalIntervals: []
    })

    const flows = await prismaClient.subscriptionFlow.findMany()
    expect(flows.length).toEqual(1)
    expect(flows[0].default).toEqual(false)
    expect(flows[0].memberPlanId).toEqual(plan.id)
    expect(flows[0].subscribeMailTemplateId).toEqual(template.id)
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
        memberPlan: {id: plan.id},
        paymentMethods: [],
        periodicities: [],
        autoRenewal: [],
        additionalIntervals: []
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
        memberPlan: {id: plan.id},
        paymentMethods: [],
        periodicities: ['monthly'],
        autoRenewal: [],
        additionalIntervals: []
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
      memberPlan: {id: plan.id},
      paymentMethods: [],
      periodicities: ['yearly'],
      autoRenewal: [],
      additionalIntervals: []
    })

    const flows = await prismaClient.subscriptionFlow.findMany()
    expect(flows.length).toEqual(2)
    expect(flows[0].default).toEqual(false)
    expect(flows[0].id).toEqual(existingFlow.id)
    expect(flows[1].default).toEqual(false)
    expect(flows[1].id).not.toEqual(existingFlow.id)
  })

  it('updates a flow', async () => {
    const template = await createTemplate(prismaClient)
    const plan = await createPlan(prismaClient)
    const flow = await createFlow(prismaClient, {
      memberPlanId: plan.id,
      mailTemplateId: template.id
    })
    const template2 = await createTemplate(prismaClient)

    const createdFlow = await prismaClient.subscriptionFlow.findFirst({where: {id: flow.id}})
    expect(createdFlow?.subscribeMailTemplateId).toEqual(template.id)

    await controller.updateFlow({
      id: flow.id,
      paymentMethods: [],
      periodicities: [],
      autoRenewal: [],
      subscribeMailTemplate: {id: template2.id},
      renewalFailedMailTemplate: {id: template2.id},
      additionalIntervals: []
    })

    const updatedFlow = await prismaClient.subscriptionFlow.findFirst({where: {id: flow.id}})
    expect(updatedFlow?.subscribeMailTemplateId).toEqual(template2.id)
  })
})
