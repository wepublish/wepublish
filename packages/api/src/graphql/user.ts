import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean
} from 'graphql'
import {UserSort} from '../db/user'
import {GraphQLPageInfo} from './common'
import {Context} from '../context'
import {GraphQLUserRole} from './userRole'
import {GraphQLDateTime} from 'graphql-iso-date'
import {GraphQLMemberPlan} from './memberPlan'

export const GraphQLUserSubscription = new GraphQLObjectType({
  name: 'UserSubscription',
  fields: {
    memberPlan: {
      type: GraphQLNonNull(GraphQLMemberPlan),
      resolve({memberPlanId}, args, {loaders}) {
        return loaders.memberPlansByID.load(memberPlanId)
      }
    },
    paymentPeriodicity: {type: GraphQLNonNull(GraphQLString)},
    monthlyAmount: {type: GraphQLNonNull(GraphQLInt)},
    autoRenew: {type: GraphQLNonNull(GraphQLBoolean)},
    startsAt: {type: GraphQLNonNull(GraphQLDateTime)},
    payedUntil: {type: GraphQLNonNull(GraphQLDateTime)},
    paymentMethod: {type: GraphQLNonNull(GraphQLString)},
    deactivatedAt: {type: GraphQLDateTime}
  }
})

export const GraphQLUser = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: {type: GraphQLNonNull(GraphQLString)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    name: {type: GraphQLNonNull(GraphQLString)},
    email: {type: GraphQLNonNull(GraphQLString)},
    roles: {
      type: GraphQLNonNull(GraphQLList(GraphQLUserRole)),
      resolve({roleIDs}, args, {loaders}) {
        return Promise.all(roleIDs.map((roleID: string) => loaders.userRolesByID.load(roleID)))
      }
    },
    subscription: {type: GraphQLUserSubscription}
  }
})

export const GraphQLUserFilter = new GraphQLInputObjectType({
  name: 'UserFilter',
  fields: {
    name: {type: GraphQLString}
  }
})

export const GraphQLUserSort = new GraphQLEnumType({
  name: 'UserSort',
  values: {
    CREATED_AT: {value: UserSort.CreatedAt},
    MODIFIED_AT: {value: UserSort.ModifiedAt}
  }
})

export const GraphQLUserConnection = new GraphQLObjectType<any, Context>({
  name: 'UserConnection',
  fields: {
    nodes: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLUser)))},
    pageInfo: {type: GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLUserInput = new GraphQLInputObjectType({
  name: 'UserInput',
  fields: {
    name: {type: GraphQLNonNull(GraphQLString)},
    email: {type: GraphQLNonNull(GraphQLString)},
    roleIDs: {type: GraphQLList(GraphQLNonNull(GraphQLString))}
  }
})

export const GraphQLUserSubscriptionInput = new GraphQLInputObjectType({
  name: 'UserSubscriptionInput',
  fields: {
    memberPlanId: {type: GraphQLNonNull(GraphQLString)},
    paymentPeriodicity: {type: GraphQLNonNull(GraphQLString)},
    monthlyAmount: {type: GraphQLNonNull(GraphQLInt)},
    autoRenew: {type: GraphQLNonNull(GraphQLBoolean)},
    startsAt: {type: GraphQLNonNull(GraphQLDateTime)},
    payedUntil: {type: GraphQLNonNull(GraphQLDateTime)},
    paymentMethod: {type: GraphQLNonNull(GraphQLString)},
    deactivatedAt: {type: GraphQLDateTime}
  }
})
