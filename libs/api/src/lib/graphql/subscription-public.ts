import {
  GraphQLBoolean,
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
import {GraphQLPublicUser} from './user'
import {unselectPassword} from '@wepublish/user/api'

export const GraphQLPublicSubscription = new GraphQLObjectType<SubscriptionWithRelations, Context>({
  name: 'PublicSubscription',
  fields: () => ({
    id: {type: new GraphQLNonNull(GraphQLString)},
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
    user: {
      type: GraphQLPublicUser,
      async resolve({userID}, args, {prisma}) {
        return prisma.user.findUnique({
          where: {
            id: userID
          },
          select: unselectPassword
        })
      }
    }
  })
})

export const GraphQLPublicSubscriptionInput = new GraphQLInputObjectType({
  name: 'SubscriptionInput',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLString)},
    memberPlanID: {type: new GraphQLNonNull(GraphQLString)},
    paymentPeriodicity: {type: new GraphQLNonNull(GraphQLPaymentPeriodicity)},
    monthlyAmount: {type: new GraphQLNonNull(GraphQLInt)},
    autoRenew: {type: new GraphQLNonNull(GraphQLBoolean)},
    paymentMethodID: {type: new GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLSubscriptionResolver = {
  __resolveReference: async (reference, {loaders}: Context) => {
    console.log('?????')
    const {id} = reference
    const subscription = await loaders.subscriptionsById.load(id)

    if (!subscription) {
      throw new Error('Subscription not found')
    }

    return subscription
  }
}
