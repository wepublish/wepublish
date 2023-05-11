import {Test, TestingModule} from '@nestjs/testing'
import {SubscriptionFlowHelper} from './subscription-flow.helper'
import {clearDatabase} from '../../prisma-utils'
import {PrismaModule} from '@wepublish/nest-modules'
import {PrismaService} from '@wepublish/nest-modules'
import {PaymentPeriodicity, PrismaClient, SubscriptionFlow} from '@prisma/client'
import {
  initialize,
  defineMemberPlanFactory,
  defineSubscriptionFlowFactory,
  defineSubscriptionFactory,
  defineUserFactory,
  definePaymentMethodFactory
} from '../../__generated__/fabbrica'

describe('SubscriptionFlowHelper', () => {
  let helper: SubscriptionFlowHelper

  let flow0: SubscriptionFlow
  let flow1: SubscriptionFlow
  let flow2: SubscriptionFlow

  const prismaClient = new PrismaClient()
  initialize({prisma: prismaClient})

  const UserFactory = defineUserFactory()
  const PaymentMethodFactory = definePaymentMethodFactory()
  const MemberPlanFactory = defineMemberPlanFactory()
  const SubscriptionFlowFactory = defineSubscriptionFlowFactory({
    defaultData: {
      memberPlan: MemberPlanFactory
    }
  })
  const SubscriptionFactory = defineSubscriptionFactory({
    defaultData: {
      memberPlan: MemberPlanFactory,
      user: UserFactory,
      paymentMethod: PaymentMethodFactory
    }
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule.forTest(prismaClient)],
      providers: [PrismaService, SubscriptionFlowHelper]
    }).compile()

    helper = module.get<SubscriptionFlowHelper>(SubscriptionFlowHelper)

    await clearDatabase(prismaClient, [
      'subscription_communication_flows',
      'payment.methods',
      'member.plans',
      'users',
      'subscriptions'
    ])

    const paymentMethod = await PaymentMethodFactory.create()
    const paymentMethod2 = await PaymentMethodFactory.create()
    const memberPlan = await MemberPlanFactory.create()
    flow0 = await SubscriptionFlowFactory.create({
      default: true,
      memberPlan: undefined,
      periodicities: [],
      autoRenewal: [],
      paymentMethods: undefined
    })
    flow1 = await SubscriptionFlowFactory.create({
      default: false,
      memberPlan: {connect: {id: memberPlan.id}},
      periodicities: [PaymentPeriodicity.monthly],
      autoRenewal: [true, false],
      paymentMethods: {connect: [{id: paymentMethod.id}]}
    })
    flow2 = await SubscriptionFlowFactory.create({
      default: false,
      memberPlan: {connect: {id: memberPlan.id}},
      periodicities: [PaymentPeriodicity.biannual],
      autoRenewal: [false],
      paymentMethods: {connect: [{id: paymentMethod.id}]}
    })

    // those belong to flow0
    const flow0Users = await UserFactory.createList(3)
    for (const user of flow0Users) {
      await SubscriptionFactory.create({
        user: {connect: {id: user.id}},
        memberPlan: {connect: {id: memberPlan.id}},
        paymentPeriodicity: PaymentPeriodicity.biannual,
        autoRenew: true,
        paymentMethod: {connect: {id: paymentMethod.id}}
      })
    }

    // those as well
    const flow0Users2 = await UserFactory.createList(3)
    for (const user of flow0Users2) {
      await SubscriptionFactory.create({
        user: {connect: {id: user.id}},
        memberPlan: {connect: {id: memberPlan.id}},
        paymentPeriodicity: PaymentPeriodicity.biannual,
        autoRenew: true,
        paymentMethod: {connect: {id: paymentMethod2.id}}
      })
    }

    // those belong to flow1
    const flow1Users = await UserFactory.createList(3)
    for (const user of flow1Users) {
      await SubscriptionFactory.create({
        user: {connect: {id: user.id}},
        memberPlan: {connect: {id: memberPlan.id}},
        paymentPeriodicity: PaymentPeriodicity.monthly,
        autoRenew: Math.random() > 0.5,
        paymentMethod: {connect: {id: paymentMethod.id}}
      })
    }

    // those belong to flow2
    const flow2Users = await UserFactory.createList(3)
    for (const user of flow2Users) {
      await SubscriptionFactory.create({
        user: {connect: {id: user.id}},
        memberPlan: {connect: {id: memberPlan.id}},
        paymentPeriodicity: PaymentPeriodicity.biannual,
        autoRenew: false,
        paymentMethod: {connect: {id: paymentMethod.id}}
      })
    }
  })

  afterEach(async () => {
    await prismaClient.$disconnect()
  })

  test('calculates total count for all flows', async () => {
    const flows = await prismaClient.subscriptionFlow.findMany({
      include: {
        paymentMethods: true
      }
    })

    const counts = await helper.numberOfSubscriptionsFor(flows)

    expect(counts.find(c => c.subscriptionFlowId === flow0.id)?.subscriptionCount).toEqual(12)
    expect(counts.find(c => c.subscriptionFlowId === flow1.id)?.subscriptionCount).toEqual(3)
    expect(counts.find(c => c.subscriptionFlowId === flow2.id)?.subscriptionCount).toEqual(3)
  })
})
