import {Query, Resolver} from '@nestjs/graphql'
import {SubscriptionFlowModel} from './subscription-flow.model'
import {PaymentPeriodicity} from '@prisma/client'
import {PrismaService} from '@wepublish/api'

@Resolver(of => [SubscriptionFlowProvider])
export class SubscriptionFlowProvider {
  constructor(private readonly prismaService: PrismaService) {}

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
        subscribeMailTemplate: {
          id: 1,
          name: 'Test'
        },
        invoiceCreationMailTemplate: {
          daysAwayFromEnding: 2,
          mailTemplate: {
            id: 1,
            name: 'Test'
          }
        },
        renewalSuccessMailTemplate: {
          id: 1,
          name: 'Test'
        },
        renewalFailedMailTemplate: {
          id: 1,
          name: 'Test'
        },
        deactivationUnpaidMailTemplate: {
          daysAwayFromEnding: 2,
          mailTemplate: {
            id: 1,
            name: 'Test'
          }
        },
        deactivationByUserMailTemplate: {
          id: 1,
          name: 'Test'
        },
        reactivationMailTemplate: {
          id: 1,
          name: 'Test'
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
    return subscriptionFlows
  }
}
