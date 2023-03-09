import {Subscription} from '@prisma/client'
import {
  GraphQLBoolean,
  GraphQLEnumType,
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
import {SubscriptionSort, SubscriptionWithRelations, SubscribersPerMonth} from '../db/subscription'
import {unselectPassword} from '@wepublish/user/api'
import {
  GraphQLDateFilter,
  GraphQLMetadataProperty,
  GraphQLMetadataPropertyInput,
  GraphQLMetadataPropertyPublic,
  GraphQLPageInfo
} from './common'
import {GraphQLMemberPlan, GraphQLPaymentPeriodicity, GraphQLPublicMemberPlan} from './memberPlan'
import {GraphQLPaymentMethod, GraphQLPublicPaymentMethod} from './paymentMethod'
import {
  GraphQLSubscriptionDeactivation,
  GraphQLSubscriptionDeactivationReason
} from './subscriptionDeactivation'
import {GraphQLUser} from './user'

export const GraphQLSubscription = new GraphQLObjectType<Subscription, Context>({
  name: 'Subscription',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},
    user: {
      type: GraphQLUser,
      async resolve({userID}, args, {prisma}) {
        return prisma.user.findUnique({
          where: {
            id: userID
          },
          select: unselectPassword
        })
      }
    },
    memberPlan: {
      type: GraphQLNonNull(GraphQLMemberPlan),
      resolve({memberPlanID}, args, {loaders}) {
        return loaders.memberPlansByID.load(memberPlanID)
      }
    },
    paymentPeriodicity: {type: GraphQLNonNull(GraphQLPaymentPeriodicity)},
    monthlyAmount: {type: GraphQLNonNull(GraphQLInt)},
    autoRenew: {type: GraphQLNonNull(GraphQLBoolean)},
    startsAt: {type: GraphQLNonNull(GraphQLDateTime)},
    paidUntil: {type: GraphQLDateTime},
    paymentMethod: {
      type: GraphQLNonNull(GraphQLPaymentMethod),
      resolve({paymentMethodID}, args, {loaders}) {
        return loaders.paymentMethodsByID.load(paymentMethodID)
      }
    },
    properties: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLMetadataProperty)))},
    deactivation: {type: GraphQLSubscriptionDeactivation}
  }
})

export const GraphQLPublicSubscription = new GraphQLObjectType<SubscriptionWithRelations, Context>({
  name: 'Subscription',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    memberPlan: {
      type: GraphQLNonNull(GraphQLPublicMemberPlan),
      resolve({memberPlanID}, args, {loaders}) {
        return loaders.memberPlansByID.load(memberPlanID)
      }
    },
    paymentPeriodicity: {type: GraphQLNonNull(GraphQLPaymentPeriodicity)},
    monthlyAmount: {type: GraphQLNonNull(GraphQLInt)},
    autoRenew: {type: GraphQLNonNull(GraphQLBoolean)},
    startsAt: {type: GraphQLNonNull(GraphQLDateTime)},
    paidUntil: {type: GraphQLDateTime},
    paymentMethod: {
      type: GraphQLNonNull(GraphQLPublicPaymentMethod),
      resolve({paymentMethodID}, args, {loaders}) {
        return loaders.paymentMethodsByID.load(paymentMethodID)
      }
    },
    properties: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLMetadataPropertyPublic))),
      resolve: ({properties}) => {
        return properties.filter(property => property.public).map(({key, value}) => ({key, value}))
      }
    },
    deactivation: {type: GraphQLSubscriptionDeactivation}
  }
})

export const GraphQLSubscriptionFilter = new GraphQLInputObjectType({
  name: 'SubscriptionFilter',
  fields: {
    startsAt: {type: GraphQLDateFilter},
    paidUntil: {type: GraphQLDateFilter},
    startsAtFrom: {type: GraphQLDateFilter},
    startsAtTo: {type: GraphQLDateFilter},
    paidUntilFrom: {type: GraphQLDateFilter},
    paidUntilTo: {type: GraphQLDateFilter},
    deactivationDateFrom: {type: GraphQLDateFilter},
    deactivationDateTo: {type: GraphQLDateFilter},
    deactivationReason: {type: GraphQLSubscriptionDeactivationReason},
    autoRenew: {type: GraphQLBoolean},
    paymentMethodID: {type: GraphQLString},
    memberPlanID: {type: GraphQLString},
    paymentPeriodicity: {type: GraphQLPaymentPeriodicity},
    userHasAddress: {type: GraphQLBoolean},
    userID: {type: GraphQLID}
  }
})

export const GraphQLSubscriptionSort = new GraphQLEnumType({
  name: 'SubscriptionSort',
  values: {
    CREATED_AT: {value: SubscriptionSort.CreatedAt},
    MODIFIED_AT: {value: SubscriptionSort.ModifiedAt}
  }
})

export const GraphQLSubscriptionConnection = new GraphQLObjectType<any, Context>({
  name: 'SubscriptionConnection',
  fields: {
    nodes: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLSubscription)))},
    pageInfo: {type: GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLSubscriptionDeactivationInput = new GraphQLInputObjectType({
  name: 'SubscriptionDeactivationInput',
  fields: {
    date: {type: GraphQLNonNull(GraphQLDateTime)},
    reason: {type: GraphQLNonNull(GraphQLSubscriptionDeactivationReason)}
  }
})

export const GraphQLSubscriptionInput = new GraphQLInputObjectType({
  name: 'SubscriptionInput',
  fields: {
    userID: {type: GraphQLNonNull(GraphQLID)},
    memberPlanID: {type: GraphQLNonNull(GraphQLString)},
    paymentPeriodicity: {type: GraphQLNonNull(GraphQLPaymentPeriodicity)},
    monthlyAmount: {type: GraphQLNonNull(GraphQLInt)},
    autoRenew: {type: GraphQLNonNull(GraphQLBoolean)},
    startsAt: {type: GraphQLNonNull(GraphQLDateTime)},
    paidUntil: {type: GraphQLDateTime},
    paymentMethodID: {type: GraphQLNonNull(GraphQLString)},
    properties: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLMetadataPropertyInput)))
    },
    deactivation: {type: GraphQLSubscriptionDeactivationInput}
  }
})

export const GraphQLPublicSubscriptionInput = new GraphQLInputObjectType({
  name: 'SubscriptionInput',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    memberPlanID: {type: GraphQLNonNull(GraphQLString)},
    paymentPeriodicity: {type: GraphQLNonNull(GraphQLPaymentPeriodicity)},
    monthlyAmount: {type: GraphQLNonNull(GraphQLInt)},
    autoRenew: {type: GraphQLNonNull(GraphQLBoolean)},
    paymentMethodID: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLSubscribersPerMonth = new GraphQLObjectType<SubscribersPerMonth, Context>({
  name: 'SubscribersPerMonth',
  fields: {
    month: {type: GraphQLNonNull(GraphQLString)},
    subscriberCount: {type: GraphQLNonNull(GraphQLInt)}
  }
})
