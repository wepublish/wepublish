import {Query, Resolver} from '@nestjs/graphql'
import {SubscriptionFlows} from '../models/communication-flow-settings'
import {PaymentPeriodicity} from '@wepublish/editor/api'
import {PrismaService} from '@wepublish/api'

@Resolver(of => SubscriptionFlows)
export class SubscriptionFlowSettings {
  constructor(private readonly prismaService: PrismaService) {}
  @Query(returns => SubscriptionFlows, {name: 'SubscriptionFlows'})
  async subscriptionFlowSettings() {
    console.log(await this.prismaService.subscriptionPeriod.findMany({}))
    return {
      subscriptionFlows: [
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
            daysAwayFromEnding: 2,
            mailTemplate: {
              id: 1,
              name: 'Test'
            }
          },
          renewalSuccess: {
            daysAwayFromEnding: 2,
            mailTemplate: {
              id: 1,
              name: 'Test'
            }
          },
          renewalFailed: {
            daysAwayFromEnding: 2,
            mailTemplate: {
              id: 1,
              name: 'Test'
            }
          },
          deactivationUnpaid: {
            daysAwayFromEnding: 2,
            mailTemplate: {
              id: 1,
              name: 'Test'
            }
          },
          deactivationByUser: {
            daysAwayFromEnding: 2,
            mailTemplate: {
              id: 1,
              name: 'Test'
            }
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
    }
  }
}
