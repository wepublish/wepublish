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
import {User, UserSort} from '../db/user'
import {
  GraphQLDateFilter,
  GraphQLMetadataProperty,
  GraphQLMetadataPropertyInput,
  GraphQLPageInfo
} from './common'
import {Context} from '../context'
import {GraphQLUserRole} from './userRole'
import {GraphQLDateTime} from 'graphql-iso-date'
import {GraphQLMemberPlan, GraphQLPaymentPeriodicity, GraphQLPublicMemberPlan} from './memberPlan'
import {GraphQLPaymentMethod, GraphQLPublicPaymentMethod} from './paymentMethod'

export const GraphQLUserSubscription = new GraphQLObjectType({
  name: 'UserSubscription',
  fields: {
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
    deactivatedAt: {type: GraphQLDateTime}
  }
})

export const GraphQLPublicUserSubscription = new GraphQLObjectType({
  name: 'UserSubscription',
  fields: {
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
    deactivatedAt: {type: GraphQLDateTime}
  }
})

export const GraphQLUserAddress = new GraphQLObjectType({
  name: 'UserAddress',
  fields: {
    street: {type: GraphQLNonNull(GraphQLString)},
    zipCode: {type: GraphQLNonNull(GraphQLString)},
    city: {type: GraphQLNonNull(GraphQLString)},
    country: {type: GraphQLNonNull(GraphQLString)}
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

    preferredName: {type: GraphQLString},
    address: {type: GraphQLUserAddress},

    active: {type: GraphQLNonNull(GraphQLBoolean)},
    lastLogin: {type: GraphQLDateTime},

    properties: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLMetadataProperty)))},

    roles: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLUserRole))),
      resolve({roleIDs}, args, {loaders}) {
        return Promise.all(roleIDs.map((roleID: string) => loaders.userRolesByID.load(roleID)))
      }
    },
    subscription: {type: GraphQLUserSubscription}
  }
})

export const GraphQLPublicUser = new GraphQLObjectType<User, Context>({
  name: 'User',
  fields: {
    id: {type: GraphQLNonNull(GraphQLString)},

    name: {type: GraphQLNonNull(GraphQLString)},
    email: {type: GraphQLNonNull(GraphQLString)},
    preferredName: {type: GraphQLString},
    address: {type: GraphQLUserAddress},
    subscription: {type: GraphQLPublicUserSubscription}
  }
})

export const GraphQLUserSubscriptionFilter = new GraphQLInputObjectType({
  name: 'UserSubscriptionFilter',
  fields: {
    startsAt: {type: GraphQLDateFilter},
    paidUntil: {type: GraphQLDateFilter},
    deactivatedAt: {type: GraphQLDateFilter},
    autoRenew: {type: GraphQLBoolean}
  }
})

export const GraphQLUserFilter = new GraphQLInputObjectType({
  name: 'UserFilter',
  fields: {
    name: {type: GraphQLString},
    text: {type: GraphQLString},
    subscription: {type: GraphQLUserSubscriptionFilter}
    /* hasSubscription: {type: GraphQLBoolean}, // TODO: implement filters
    rolesIDs: {type: GraphQLList(GraphQLNonNull(GraphQLString))} */
  }
})

export const GraphQLUserSort = new GraphQLEnumType({
  name: 'UserSort',
  values: {
    CREATED_AT: {value: UserSort.CreatedAt},
    MODIFIED_AT: {value: UserSort.ModifiedAt},
    NAME: {value: UserSort.Name}
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

export const GraphQLUserAddressInput = new GraphQLInputObjectType({
  name: 'UserAddressInput',
  fields: {
    street: {type: GraphQLNonNull(GraphQLString)},
    zipCode: {type: GraphQLNonNull(GraphQLString)},
    city: {type: GraphQLNonNull(GraphQLString)},
    country: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLUserInput = new GraphQLInputObjectType({
  name: 'UserInput',
  fields: {
    name: {type: GraphQLNonNull(GraphQLString)},
    email: {type: GraphQLNonNull(GraphQLString)},

    preferredName: {type: GraphQLString},
    address: {type: GraphQLUserAddressInput},

    active: {type: GraphQLNonNull(GraphQLBoolean)},

    properties: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLMetadataPropertyInput)))},

    roleIDs: {type: GraphQLList(GraphQLNonNull(GraphQLString))}
  }
})

export const GraphQLUserSubscriptionInput = new GraphQLInputObjectType({
  name: 'UserSubscriptionInput',
  fields: {
    memberPlanID: {type: GraphQLNonNull(GraphQLString)},
    paymentPeriodicity: {type: GraphQLNonNull(GraphQLPaymentPeriodicity)},
    monthlyAmount: {type: GraphQLNonNull(GraphQLInt)},
    autoRenew: {type: GraphQLNonNull(GraphQLBoolean)},
    startsAt: {type: GraphQLNonNull(GraphQLDateTime)},
    paidUntil: {type: GraphQLDateTime},
    paymentMethodID: {type: GraphQLNonNull(GraphQLString)},
    deactivatedAt: {type: GraphQLDateTime}
  }
})

export const GraphQLPublicUserInput = new GraphQLInputObjectType({
  name: 'UserInput',
  fields: {
    name: {type: GraphQLNonNull(GraphQLString)},
    email: {type: GraphQLNonNull(GraphQLString)},

    preferredName: {type: GraphQLString},
    address: {type: GraphQLUserAddressInput}
  }
})

export const GraphQLPublicUserSubscriptionInput = new GraphQLInputObjectType({
  name: 'UserSubscriptionInput',
  fields: {
    memberPlanID: {type: GraphQLNonNull(GraphQLString)},
    paymentPeriodicity: {type: GraphQLNonNull(GraphQLPaymentPeriodicity)},
    monthlyAmount: {type: GraphQLNonNull(GraphQLInt)},
    autoRenew: {type: GraphQLNonNull(GraphQLBoolean)},
    paymentMethodID: {type: GraphQLNonNull(GraphQLString)}
  }
})
