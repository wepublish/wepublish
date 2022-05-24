import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLID
} from 'graphql'
import {
  GraphQLDateFilter,
  GraphQLMetadataProperty,
  GraphQLMetadataPropertyInput,
  GraphQLMetadataPropertyPublic,
  GraphQLPageInfo
} from './common'
import {Context} from '../context'
import {GraphQLDateTime} from 'graphql-iso-date'
import {GraphQLMemberPlan, GraphQLPaymentPeriodicity, GraphQLPublicMemberPlan} from './memberPlan'
import {GraphQLPaymentMethod, GraphQLPublicPaymentMethod} from './paymentMethod'
import {Subscription, SubscriptionDeactivationReason, SubscriptionSort} from '../db/subscription'
import {GraphQLUser} from './user'
import {NotFound} from '../error'
import {isTempUser, removePrefixTempUser} from '../utility'

export const GraphQLSubscriptionDeactivationReason = new GraphQLEnumType({
  name: 'SubscriptionDeactivationReason',
  values: {
    NONE: {value: SubscriptionDeactivationReason.None},
    USER_SELF_DEACTIVATED: {value: SubscriptionDeactivationReason.UserSelfDeactivated},
    INVOICE_NOT_PAID: {value: SubscriptionDeactivationReason.InvoiceNotPaid}
  }
})

export const GraphQLSubscriptionDeactivation = new GraphQLObjectType({
  name: 'SubscriptionDeactivation',
  fields: {
    date: {type: GraphQLNonNull(GraphQLDateTime)},
    reason: {type: GraphQLNonNull(GraphQLSubscriptionDeactivationReason)}
  }
})

export const GraphQLSubscription = new GraphQLObjectType<Subscription, Context>({
  name: 'Subscription',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},
    user: {
      type: GraphQLUser,
      async resolve({userID}, args, {dbAdapter}) {
        if (isTempUser(userID)) {
          const tempUser = await dbAdapter.tempUser.getTempUserByID(removePrefixTempUser(userID))
          if (!tempUser) throw new NotFound('TempUser', userID)
          return {
            id: userID,
            name: tempUser.name,
            email: tempUser.email,
            preferredName: tempUser.preferredName,
            createdAt: tempUser.createdAt,
            modifiedAt: tempUser.modifiedAt,
            active: false,
            properties: [],
            emailVerifiedAt: null,
            lastLogin: null,
            oauth2Accounts: [],
            paymentProviderCustomers: [],
            roleIDs: []
          }
        } else {
          return dbAdapter.user.getUserByID(userID)
        }
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

export const GraphQLPublicSubscription = new GraphQLObjectType<Subscription, Context>({
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
    userHasAddress: {type: GraphQLBoolean}
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
