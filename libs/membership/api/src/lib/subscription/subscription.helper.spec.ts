import {Test, TestingModule} from '@nestjs/testing'
import {clearDatabase} from '../../prisma-utils'
import {PrismaModule} from '@wepublish/nest-modules'
import {PrismaService} from '@wepublish/nest-modules'
import {PrismaClient, Subscription, SubscriptionDeactivationReason} from '@prisma/client'
import {
  initialize,
  defineMemberPlanFactory,
  defineSubscriptionFactory,
  defineUserFactory,
  definePaymentMethodFactory,
  defineInvoiceFactory
} from '../../__generated__/fabbrica'
import {registerPaymentsModule} from '../testing/module-registrars'
import {SubscriptionHelper} from './subscription.helper'

describe('SubscriptionHelper', () => {
  let helper: SubscriptionHelper

  let subscription0: Subscription

  const prismaClient = new PrismaClient()
  initialize({prisma: prismaClient})

  const UserFactory = defineUserFactory()
  const PaymentMethodFactory = definePaymentMethodFactory()
  const MemberPlanFactory = defineMemberPlanFactory()
  const InvoiceFactory = defineInvoiceFactory()

  const SubscriptionFactory = defineSubscriptionFactory({
    defaultData: {
      memberPlan: MemberPlanFactory,
      user: UserFactory,
      paymentMethod: PaymentMethodFactory
    }
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule.forTest(prismaClient), registerPaymentsModule()],
      providers: [PrismaService, SubscriptionHelper]
    }).compile()

    helper = module.get<SubscriptionHelper>(SubscriptionHelper)

    await clearDatabase(prismaClient, ['payment.methods', 'member.plans', 'users', 'subscriptions'])

    subscription0 = await SubscriptionFactory.create({
      autoRenew: false
    })
    await InvoiceFactory.create({
      subscription: {
        connect: {
          id: subscription0.id
        }
      },
      paidAt: new Date()
    })
    await InvoiceFactory.create({
      subscription: {
        connect: {
          id: subscription0.id
        }
      }
    })
    await InvoiceFactory.create({
      subscription: {
        connect: {
          id: subscription0.id
        }
      }
    })
  })

  afterEach(async () => {
    await prismaClient.$disconnect()
  })

  test('cancel invoice of subscription', async () => {
    const promises = await helper.cancelInvoicesForSubscription(subscription0.id)
    expect(promises.length).toEqual(2)
    await prismaClient.$transaction(promises)
    const canceled = await prismaClient.invoice.findMany({where: {canceledAt: {not: null}}})
    const paid = await prismaClient.invoice.findMany({where: {paidAt: {not: null}}})
    expect(canceled.length).toEqual(2)
    expect(paid.length).toEqual(1)
  })

  test('cancel subscription by id', async () => {
    await helper.cancelSubscriptionById(
      subscription0.id,
      SubscriptionDeactivationReason.userSelfDeactivated
    )
    const canceled = await prismaClient.invoice.findMany({where: {canceledAt: {not: null}}})
    const paid = await prismaClient.invoice.findMany({where: {paidAt: {not: null}}})
    const deactivation = await prismaClient.subscriptionDeactivation.findMany({
      where: {subscriptionID: subscription0.id}
    })
    expect(canceled.length).toEqual(2)
    expect(paid.length).toEqual(1)
    expect(deactivation.length).toEqual(1)
  })
})
