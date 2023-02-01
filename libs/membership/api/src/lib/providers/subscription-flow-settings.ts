import {Query, Resolver} from '@nestjs/graphql'
import {SubscriptionFlow} from '../models/subscription-flow-settings'
import {PaymentPeriodicity} from '@wepublish/editor/api'
import {PrismaService} from '@wepublish/api'

@Resolver(of => [SubscriptionFlow])
export class SubscriptionFlowSettings {
  constructor(private readonly prismaService: PrismaService) {}

  @Query(returns => [SubscriptionFlow], {name: 'SubscriptionFlows'})
  async subscriptionFlowSettings() {
    let subscriptionFlow: SubscriptionFlow[] = []

    console.log(
      await this.prismaService['subscriptionFlow'].findMany({
        include: {
          memberPlan: true,
          subscribeMailTemplate: true,
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
    )

    subscriptionFlow = [
      {
        // FILTER
        id: 1,
        default: false,
        memberPlan: {
          id: 1,
          name: 'testPlan'
        },
        paymentMethods: [
          {
            id: 2,
            name: 'payrexx'
          }
        ],
        periodicities: [PaymentPeriodicity.Yearly],
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
