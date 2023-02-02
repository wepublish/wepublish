import {Args, Query, Resolver} from '@nestjs/graphql'
import {SubscriptionFlowModel} from './subscription-flow.model'
import {PrismaService} from '@wepublish/api'

@Resolver(of => [SubscriptionFlowProvider])
export class SubscriptionFlowProvider {
  constructor(private readonly prismaService: PrismaService) {}

  @Query(returns => [SubscriptionFlowModel], {name: 'SubscriptionFlows'})
  async subscriptionFlowSettings(@Args('defaultFlow') defaultFlow: boolean) {
    let where = {}
    if (defaultFlow) {
      where = {
        default: true
      }
    }

    return await this.prismaService['subscriptionFlow'].findMany({
      where,
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
  }
}
