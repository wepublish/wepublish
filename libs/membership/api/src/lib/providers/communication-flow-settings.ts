import {Query, Resolver} from '@nestjs/graphql'
import {SubscriptionCommunicationFlows} from '../models/communication-flow-settings'
import {PaymentPeriodicity} from '@wepublish/editor/api'
@Resolver(of => SubscriptionCommunicationFlows)
export class CommunicationFlowSettings {
  @Query(returns => SubscriptionCommunicationFlows, {name: 'SubscriptionCommunicationFlows'})
  async communicationFlowSettings() {
    return {
      subscriptionCommunicationFlows: [
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
