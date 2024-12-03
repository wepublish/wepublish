import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'
import {GraphQLDateTime} from 'graphql-scalars'
import {Context} from '../context'
import {SubscriptionWithRelations} from '../db/subscription'
import {createProxyingResolver} from '../utility'
import {GraphQLMetadataPropertyPublic} from './common'
import {GraphQLPaymentPeriodicity, GraphQLPublicMemberPlan} from './memberPlan'
import {GraphQLPublicPaymentMethod} from './paymentMethod'
import {GraphQLSubscriptionDeactivation} from './subscriptionDeactivation'
import {add} from 'date-fns'

export const GraphQLPublicSubscription = new GraphQLObjectType<SubscriptionWithRelations, Context>({
  name: 'Subscription',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},
    memberPlan: {
      type: new GraphQLNonNull(GraphQLPublicMemberPlan),
      resolve({memberPlanID}, args, {loaders}) {
        return loaders.memberPlansByID.load(memberPlanID)
      }
    },
    paymentPeriodicity: {type: new GraphQLNonNull(GraphQLPaymentPeriodicity)},
    monthlyAmount: {type: new GraphQLNonNull(GraphQLInt)},
    autoRenew: {type: new GraphQLNonNull(GraphQLBoolean)},
    startsAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    paidUntil: {type: GraphQLDateTime},
    paymentMethod: {
      type: new GraphQLNonNull(GraphQLPublicPaymentMethod),
      resolve({paymentMethodID}, args, {loaders}) {
        return loaders.paymentMethodsByID.load(paymentMethodID)
      }
    },
    extendable: {type: new GraphQLNonNull(GraphQLBoolean)},
    properties: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLMetadataPropertyPublic))),
      resolve: ({properties}) => {
        return properties.filter(property => property.public).map(({key, value}) => ({key, value}))
      }
    },
    deactivation: {type: GraphQLSubscriptionDeactivation},
    url: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: createProxyingResolver(async (subscription, _, {urlAdapter}) => {
        return await urlAdapter.getSubscriptionURL(subscription)
      })
    },
    canExtend: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: createProxyingResolver(async (subscription, _, context) => {
        const [paymentMethod, unpaidInvoice] = await Promise.all([
          context.loaders.paymentMethodsByID.load(subscription.paymentMethodID),
          context.prisma.invoice.findFirst({
            where: {
              subscription: {
                userID: subscription.userID
              },
              OR: [{canceledAt: null}, {paidAt: null}]
            }
          })
        ])

        /**
         * Can only extend when:
         *   Subscription is extendable
         *   Subscription is not deactivated
         *   Subscription is about to run out (less than 1 month)
         *   All invoices have been paid (or cancelled)
         *   Not using a deprecated payment method
         */
        return (
          subscription.extendable &&
          !subscription.deactivation &&
          +add(new Date(), {months: 1}) > +subscription.paidUntil &&
          !unpaidInvoice &&
          // @TODO: Remove when all 'payrexx subscriptions' subscriptions have been migrated
          paymentMethod.slug !== 'payrexx-subscription'
        )
      })
    }
  }
})

export const GraphQLPublicSubscriptionInput = new GraphQLInputObjectType({
  name: 'SubscriptionInput',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},
    memberPlanID: {type: new GraphQLNonNull(GraphQLString)},
    paymentPeriodicity: {type: new GraphQLNonNull(GraphQLPaymentPeriodicity)},
    monthlyAmount: {type: new GraphQLNonNull(GraphQLInt)},
    autoRenew: {type: new GraphQLNonNull(GraphQLBoolean)},
    paymentMethodID: {type: new GraphQLNonNull(GraphQLString)}
  }
})
