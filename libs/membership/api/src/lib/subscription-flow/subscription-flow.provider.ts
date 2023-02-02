import {Query, Resolver} from '@nestjs/graphql'
import {SubscriptionFlowModel} from './subscription-flow.model'
import {PaymentPeriodicity} from '@prisma/client'
import {PrismaService} from '@wepublish/api'

@Resolver(of => [SubscriptionFlowProvider])
export class SubscriptionFlowProvider {
  constructor(private readonly prismaService: PrismaService) {}
  N
  @Query(returns => [SubscriptionFlowModel], {name: 'SubscriptionFlows'})
  async subscriptionFlowSettings() {
    let subscriptionFlow: SubscriptionFlowModel[] = []

    const subscriptionFlows = await this.prismaService['subscriptionFlow'].findMany({
      include: {
        memberPlan: true,
        subscribeMailTemplate: true,
        paymentMethods: true,
        invoiceCreationMailTemplate: {
          include: {
            mailTemplate: true
          }
        },
        renewalSuccessMailTemplate: true,
        renewalFailedMailTemplate: true,
        deactivationUnpaidMailTemplate: {
          include: {
            mailTemplate: true
          }
        },
        deactivationByUserMailTemplate: true,
        reactivationMailTemplate: true,
        additionalIntervals: {
          include: {
            mailTemplate: true
          }
        }
      }
    })

    const decoratedObject: SubscriptionFlowModel[] = []
    for (const subscriptionFlow of subscriptionFlows) {
      // MemberPlans
      let decoratedMemberplan = null
      if (subscriptionFlow.memberPlan) {
        decoratedMemberplan = {
          id: subscriptionFlow.memberPlan.id,
          name: subscriptionFlow.memberPlan.name
        }
      }

      // PaymentAddapters
      const decoratedPaymentMethode = []
      for (const paymentAdapter of subscriptionFlow.paymentMethods) {
        decoratedPaymentMethode.push({
          id: paymentAdapter.id,
          name: paymentAdapter.name
        })
      }

      // Convert  Prisma enum to gql enum
      const periodicities = subscriptionFlow.periodicities as unknown as PaymentPeriodicity[]

      console.log(periodicities)
      console.log([PaymentPeriodicity.yearly])

      const subscribe = null

      const invoiceCreation = null

      const renewalSuccess = null

      const renewalFailed = null

      const deactivationUnpaid = null

      const deactivationByUser = null

      const reactivation = null

      const additionalIntervals = []

      // Construct Main Subscription Flow

      decoratedObject.push({
        id: subscriptionFlow.id,
        default: subscriptionFlow.default,
        memberPlan: decoratedMemberplan,
        paymentMethods: decoratedPaymentMethode,
        periodicities: periodicities,
        autoRenewal: subscriptionFlow.autoRenewal,
        subscribe: subscriptionFlow.subscribeMailTemplate,
        invoiceCreation: invoiceCreation,
        renewalSuccess: renewalSuccess,
        renewalFailed: renewalFailed,
        deactivationUnpaid: deactivationUnpaid,
        deactivationByUser: deactivationByUser,
        reactivation: reactivation,
        additionalIntervals: additionalIntervals
      })
    }

    subscriptionFlow = [
      {
        // FILTER
        id: 1,
        default: false,
        memberPlan: {
          id: 'xxx',
          name: 'testPlan'
        },
        paymentMethods: [
          {
            id: 'xxx',
            name: 'payrexx'
          }
        ],
        periodicities: [PaymentPeriodicity.yearly],
        autoRenewal: [true, false],
        subscribe: {
          id: 1,
          name: 'Test'
        },
        invoiceCreation: {
          id: 1,
          name: 'Test'
        },
        renewalSuccess: {
          id: 1,
          name: 'Test'
        },
        renewalFailed: {
          id: 1,
          name: 'Test'
        },
        deactivationUnpaid: {
          daysAwayFromEnding: 2,
          mailTemplate: {
            id: 1,
            name: 'Test'
          }
        },
        deactivationByUser: {
          id: 1,
          name: 'Test'
        },
        reactivation: {
          daysAwayFromEnding: 2,
          mailTemplate: {
            id: 1,
            name: 'Test'
          }
        },
        additionalIntervals: [
          {
            daysAwayFromEnding: 2,
            mailTemplate: {
              id: 1,
              name: 'Test'
            }
          },
          {
            daysAwayFromEnding: 4,
            mailTemplate: {
              id: 1,
              name: 'Test'
            }
          }
        ]
      }
    ]
    return subscriptionFlow
  }
}
