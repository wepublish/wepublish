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
  definePaymentMethodFactory
} from '@wepublish/api'
import {initOldContextForTest} from '../../oldcontext-utils'

describe('SubscriptionFlowController', () => {
  let controller: SubscriptionFlowController
  const prismaClient = new PrismaClient()
  initialize({prisma: prismaClient})

  const MemberPlanFactory = defineMemberPlanFactory()
  const MailTemplateFactory = defineMailTemplateFactory()
  const PaymentMethodFactory = definePaymentMethodFactory()
  const SubscriptionFlowFactory = defineSubscriptionFlowFactory({
    defaultData: {
      memberPlan: MemberPlanFactory,
      intervals: {connect: []}
    }
  })

  beforeEach(async () => {
    await initOldContextForTest(prismaClient)
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

  it('is defined', () => {
    expect(controller).toBeDefined()
  })

  it('returns only default flow', async () => {
    const template = await MailTemplateFactory.createForConnect()
    const customFlow = await SubscriptionFlowFactory.create({
      intervals: {
        create: [
          {
            event: SubscriptionEvent.INVOICE_CREATION,
            mailTemplateId: template.id,
            daysAwayFromEnding: null
          }
        ]
      }
    })
    expect(customFlow.default).toEqual(false)
    const defaultFlow = await SubscriptionFlowFactory.create({
      default: true,
      intervals: {
        create: [
          {
            event: SubscriptionEvent.INVOICE_CREATION,
            mailTemplateId: template.id,
            daysAwayFromEnding: null
          }
        ]
      }
    })

    const result = await controller.getFlows(true)
    expect(result.length).toEqual(1)
    expect(result[0].default).toEqual(true)
    expect(result[0].id).toEqual(defaultFlow.id)
  })

  it('returns all flows with default first', async () => {
    const customFlow = await SubscriptionFlowFactory.create()
    expect(customFlow.default).toEqual(false)
    const defaultFlow = await SubscriptionFlowFactory.create({
      default: true
    })

    const result = await controller.getFlows(false)
    expect(result.length).toEqual(2)
    expect(result[0].default).toEqual(true)
    expect(result[0].id).toEqual(defaultFlow.id)
    expect(result[1].default).toEqual(false)
    expect(result[1].id).toEqual(customFlow.id)
  })

  it('prevents deletion of nonexistent flow', async () => {
    const t = async () => {
      await controller.deleteFlow(-1)
    }

    expect(t).rejects.toThrow(Error)
  })

  it('prevents deletion of default flow', async () => {
    const defaultFlow = await SubscriptionFlowFactory.create({
      default: true
    })

    const t = async () => {
      await controller.deleteFlow(defaultFlow.id)
    }

    expect(t).rejects.toThrow(Error)
  })

  it('creates a flow', async () => {
    const plan = await MemberPlanFactory.create()
    const paymentMethod = await PaymentMethodFactory.create()

    await controller.createFlow({
      memberPlanId: plan.id,
      paymentMethodIds: [paymentMethod.id],
      periodicities: [PaymentPeriodicity.monthly],
      autoRenewal: [true]
    })

    const flows = await prismaClient.subscriptionFlow.findMany({include: {intervals: true}})
    expect(flows.length).toEqual(1)
    expect(flows[0].default).toEqual(false)
    expect(flows[0].memberPlanId).toEqual(plan.id)
    expect(flows[0].intervals.length).toEqual(2)
  })

  it('prevents creation of a second default flow', async () => {
    const plan = await MemberPlanFactory.create()
    const defaultFlow = await SubscriptionFlowFactory.create({
      default: true
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
    const paymentMethod = await PaymentMethodFactory.create()
    const plan = await MemberPlanFactory.create()
    const existingFlow = await SubscriptionFlowFactory.create({
      paymentMethods: {connect: [{id: paymentMethod.id}]},
      periodicities: ['monthly', 'yearly'],
      autoRenewal: [true, false]
    })

    await expect(
      controller.createFlow({
        memberPlanId: plan.id,
        paymentMethodIds: [paymentMethod.id],
        periodicities: ['monthly'],
        autoRenewal: [true, false]
      })
    ).rejects.toThrowError()

    const flows = await prismaClient.subscriptionFlow.findMany()
    expect(flows.length).toEqual(1)
    expect(flows[0].default).toEqual(false)
    expect(flows[0].id).toEqual(existingFlow.id)
  })

  it('allows creation of flows with different filters', async () => {
    const method = await PaymentMethodFactory.createForConnect()
    const plan = await MemberPlanFactory.create()
    const existingFlow = await SubscriptionFlowFactory.create({
      periodicities: ['monthly'],
      autoRenewal: [true],
      paymentMethods: {connect: [{id: method.id}]}
    })

    await controller.createFlow({
      memberPlanId: plan.id,
      paymentMethodIds: [method.id],
      periodicities: ['yearly'],
      autoRenewal: [true]
    })

    const flows = await prismaClient.subscriptionFlow.findMany()
    expect(flows.length).toEqual(2)
    expect(flows[0].default).toEqual(false)
    expect(flows[0].id).toEqual(existingFlow.id)
    expect(flows[1].default).toEqual(false)
    expect(flows[1].id).not.toEqual(existingFlow.id)
  })

  it('prevents update of flows with empty or same filters', async () => {
    const method = await PaymentMethodFactory.createForConnect()
    const plan = await MemberPlanFactory.create()
    await SubscriptionFlowFactory.create({
      memberPlan: {connect: {id: plan.id}},
      periodicities: ['monthly'],
      autoRenewal: [true],
      paymentMethods: {connect: [{id: method.id}]}
    })
    const existingFlow2 = await SubscriptionFlowFactory.create({
      memberPlan: {connect: {id: plan.id}},
      periodicities: ['monthly'],
      autoRenewal: [false],
      paymentMethods: {connect: [{id: method.id}]}
    })

    const t1 = async () => {
      await controller.updateFlow({
        id: existingFlow2.id,
        paymentMethodIds: [],
        periodicities: [],
        autoRenewal: []
      })
    }

    expect(t1).rejects.toThrow(Error)

    const t2 = async () => {
      await controller.updateFlow({
        id: existingFlow2.id,
        paymentMethodIds: [method.id],
        periodicities: ['monthly'],
        autoRenewal: [true]
      })
    }

    expect(t2).rejects.toThrow(Error)
  })

  it('updates intervals of a flow', async () => {
    const template = await MailTemplateFactory.create()
    const template2 = await MailTemplateFactory.create()

    const flow = await SubscriptionFlowFactory.create({
      intervals: {
        create: [
          {
            event: SubscriptionEvent.INVOICE_CREATION,
            mailTemplateId: template.id,
            daysAwayFromEnding: -3
          }
        ]
      }
    })

    const createdFlow = await prismaClient.subscriptionFlow.findFirst({
      where: {id: flow.id},
      include: {intervals: true}
    })
    const existingInterval = createdFlow?.intervals.find(
      i => i.event === SubscriptionEvent.INVOICE_CREATION
    )

    if (existingInterval === undefined) {
      fail()
    }

    expect(existingInterval.mailTemplateId).toEqual(template.id)
    expect(existingInterval.daysAwayFromEnding).toEqual(-3)

    await controller.updateIntervals([
      {
        id: existingInterval.id,
        mailTemplateId: template2.id,
        daysAwayFromEnding: -5
      }
    ])

    const updatedFlow = await prismaClient.subscriptionFlow.findFirst({
      where: {id: flow.id},
      include: {intervals: true}
    })
    const newInterval = updatedFlow?.intervals.find(
      i => i.event === SubscriptionEvent.INVOICE_CREATION
    )
    expect(newInterval?.mailTemplateId).toEqual(template2.id)
  })

  it('prevents update of nonexisting interval', async () => {
    const t = async () => {
      await controller.updateIntervals([
        {
          id: 9999,
          mailTemplateId: 1,
          daysAwayFromEnding: -5
        }
      ])
    }
    expect(t).rejects.toThrow(Error)
  })

  it('creates intervals for an existing flow', async () => {
    const flow = await SubscriptionFlowFactory.create()
    const template = await MailTemplateFactory.create()

    const existingFlow = await prismaClient.subscriptionFlow.findFirst({
      where: {id: flow.id},
      include: {intervals: true}
    })
    expect(existingFlow?.intervals.length).toEqual(0)

    await controller.createInterval({
      subscriptionFlowId: existingFlow?.id,
      mailTemplateId: template.id,
      event: 'SUBSCRIBE'
    })

    const updatedFlow = await prismaClient.subscriptionFlow.findFirst({
      where: {id: flow.id},
      include: {intervals: true}
    })
    expect(updatedFlow?.intervals.length).toEqual(1)
    expect(updatedFlow?.intervals[0].event).toEqual('SUBSCRIBE')
  })

  it('prevents creation of duplicate intervals for an existing flow', async () => {
    const flow = await SubscriptionFlowFactory.create()
    const template = await MailTemplateFactory.create()

    await controller.createInterval({
      subscriptionFlowId: flow.id,
      mailTemplateId: template.id,
      event: 'SUBSCRIBE'
    })

    const t = async () => {
      await controller.createInterval({
        subscriptionFlowId: flow.id,
        mailTemplateId: template.id,
        event: 'SUBSCRIBE'
      })
    }
    expect(t).rejects.toThrow(Error)
  })

  it('prevents creation of invalid daysAwayFromEnding', async () => {
    const flow = await SubscriptionFlowFactory.create()
    const template = await MailTemplateFactory.create()

    const t1 = async () => {
      await controller.createInterval({
        subscriptionFlowId: flow.id,
        mailTemplateId: template.id,
        event: 'SUBSCRIBE',
        daysAwayFromEnding: 3
      })
    }
    expect(t1).rejects.toThrow(Error)

    const t2 = async () => {
      await controller.createInterval({
        subscriptionFlowId: flow.id,
        mailTemplateId: template.id,
        event: 'CUSTOM',
        daysAwayFromEnding: -30
      })
    }
    expect(t2).rejects.toThrow(Error)

    const t3 = async () => {
      await controller.createInterval({
        subscriptionFlowId: flow.id,
        mailTemplateId: template.id,
        event: 'DEACTIVATION_UNPAID',
        daysAwayFromEnding: -5
      })
    }
    expect(t3).rejects.toThrow(Error)

    const t4 = async () => {
      await controller.createInterval({
        subscriptionFlowId: flow.id,
        mailTemplateId: template.id,
        event: 'INVOICE_CREATION',
        daysAwayFromEnding: 3
      })
    }
    expect(t4).rejects.toThrow(Error)
  })

  it('deletes intervals for an existing flow', async () => {
    const template = await MailTemplateFactory.create()
    const flow = await SubscriptionFlowFactory.create({
      intervals: {
        create: [
          {
            event: SubscriptionEvent.CUSTOM,
            mailTemplateId: template.id,
            daysAwayFromEnding: 3
          }
        ]
      }
    })

    const existingFlow = await prismaClient.subscriptionFlow.findFirst({
      where: {id: flow.id},
      include: {intervals: true}
    })

    if (existingFlow === null) {
      fail()
    }

    expect(existingFlow.intervals.length).toEqual(1)

    await controller.deleteInterval({
      id: existingFlow.intervals[0].id
    })

    const updatedFlow = await prismaClient.subscriptionFlow.findFirst({
      where: {id: flow.id},
      include: {intervals: true}
    })

    if (updatedFlow === null) {
      fail()
    }

    expect(updatedFlow.intervals.length).toEqual(0)
  })

  it('prevents deletion of required intervals', async () => {
    const template = await MailTemplateFactory.create()
    const flow = await SubscriptionFlowFactory.create({
      intervals: {
        create: [
          {
            event: SubscriptionEvent.INVOICE_CREATION,
            mailTemplateId: template.id,
            daysAwayFromEnding: 3
          }
        ]
      }
    })

    const existingFlow = await prismaClient.subscriptionFlow.findFirst({
      where: {id: flow.id},
      include: {intervals: true}
    })
    if (existingFlow === null) {
      fail()
    }

    const existingInterval = existingFlow?.intervals.find(
      i => i.event === SubscriptionEvent.INVOICE_CREATION
    )
    if (existingInterval === undefined) {
      fail()
    }

    const t = async () => {
      await controller.deleteInterval({id: existingInterval.id})
    }
    expect(t).rejects.toThrow(Error)
  })

  it('prevents deletion of nonexisting interval', async () => {
    const t = async () => {
      await controller.deleteInterval({
        id: 9999
      })
    }
    expect(t).rejects.toThrow(Error)
  })
})
