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
import {User, UserSort} from '../db/user'
import {GraphQLMetadataProperty, GraphQLMetadataPropertyInput, GraphQLPageInfo} from './common'
import {Context} from '../context'
import {GraphQLUserRole} from './userRole'
import {GraphQLDateTime} from 'graphql-iso-date'
import {GraphQLPublicPayment} from './payment'
import {GraphQLMemberPlan, GraphQLPaymentPeriodicity} from './memberPlan'
import {GraphQLInvoice} from './invoice'
import {GraphQLSubscriptionDeactivation} from './subscriptionDeactivation'
import {GraphQLSubscriptionPeriod} from './subscriptionPeriods'
import {Subscription} from '../db/subscription'
import {createProxyingResolver} from '../utility'

export const GraphQLUserAddress = new GraphQLObjectType({
  name: 'UserAddress',
  fields: {
    company: {type: GraphQLString},
    streetAddress: {type: GraphQLNonNull(GraphQLString)},
    streetAddress2: {type: GraphQLString},
    zipCode: {type: GraphQLNonNull(GraphQLString)},
    city: {type: GraphQLNonNull(GraphQLString)},
    country: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLPaymentProviderCustomer = new GraphQLObjectType({
  name: 'PaymentProviderCustomer',
  fields: {
    paymentProviderID: {type: GraphQLNonNull(GraphQLString)},
    customerID: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLOAuth2Account = new GraphQLObjectType({
  name: 'OAuth2Account',
  fields: {
    type: {type: GraphQLNonNull(GraphQLString)},
    provider: {type: GraphQLNonNull(GraphQLString)},
    scope: {type: GraphQLNonNull(GraphQLString)}
  }
})

const GraphQLUserSubscription = new GraphQLObjectType<Subscription, Context>({
  name: 'UserSubscription',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},
    paymentPeriodicity: {type: GraphQLNonNull(GraphQLPaymentPeriodicity)},
    monthlyAmount: {type: GraphQLNonNull(GraphQLInt)},
    autoRenew: {type: GraphQLNonNull(GraphQLBoolean)},
    startsAt: {type: GraphQLNonNull(GraphQLDateTime)},
    paidUntil: {type: GraphQLDateTime},
    properties: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLMetadataProperty)))},
    deactivation: {type: GraphQLSubscriptionDeactivation},
    periods: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLSubscriptionPeriod)))
    },
    memberPlan: {
      type: GraphQLNonNull(GraphQLMemberPlan),
      resolve({memberPlanID}, args, {dbAdapter}) {
        return dbAdapter.memberPlan.getMemberPlanById(memberPlanID) // by subscription
      }
    },
    invoices: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLInvoice))),
      resolve({id}, args, {dbAdapter}) {
        return dbAdapter.invoice.getInvoicesBySubscriptionID(id)
      }
    }
  }
})

export const GraphQLUser = new GraphQLObjectType<User, Context>({
  name: 'User',
  fields: {
    id: {type: GraphQLNonNull(GraphQLString)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    name: {type: GraphQLNonNull(GraphQLString)},
    firstName: {type: GraphQLString},
    email: {type: GraphQLNonNull(GraphQLString)},
    emailVerifiedAt: {type: GraphQLDateTime},

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
    paymentProviderCustomers: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPaymentProviderCustomer)))
    },
    oauth2Accounts: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLOAuth2Account)))
    },
    subscriptions: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLUserSubscription))),
      resolve: createProxyingResolver(({id}, _, {dbAdapter}) => {
        return dbAdapter.subscription.getSubscriptionsByUserID(id)
      })
    }
  }
})

export const GraphQLPublicUser = new GraphQLObjectType<User, Context>({
  name: 'User',
  fields: {
    id: {type: GraphQLNonNull(GraphQLString)},

    name: {type: GraphQLNonNull(GraphQLString)},
    firstName: {type: GraphQLString},
    email: {type: GraphQLNonNull(GraphQLString)},
    preferredName: {type: GraphQLString},
    address: {type: GraphQLUserAddress},
    paymentProviderCustomers: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPaymentProviderCustomer)))
    },
    oauth2Accounts: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLOAuth2Account)))
    }
  }
})

export const GraphQLUserFilter = new GraphQLInputObjectType({
  name: 'UserFilter',
  fields: {
    name: {type: GraphQLString},
    text: {type: GraphQLString}
  }
})

export const GraphQLUserSort = new GraphQLEnumType({
  name: 'UserSort',
  values: {
    CREATED_AT: {value: UserSort.CreatedAt},
    MODIFIED_AT: {value: UserSort.ModifiedAt},
    NAME: {value: UserSort.Name},
    FIRST_NAME: {value: UserSort.FirstName}
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
    company: {type: GraphQLString},
    streetAddress: {type: GraphQLNonNull(GraphQLString)},
    streetAddress2: {type: GraphQLString},
    zipCode: {type: GraphQLNonNull(GraphQLString)},
    city: {type: GraphQLNonNull(GraphQLString)},
    country: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLUserInput = new GraphQLInputObjectType({
  name: 'UserInput',
  fields: {
    name: {type: GraphQLNonNull(GraphQLString)},
    firstName: {type: GraphQLString},
    email: {type: GraphQLNonNull(GraphQLString)},
    emailVerifiedAt: {type: GraphQLDateTime},

    preferredName: {type: GraphQLString},
    address: {type: GraphQLUserAddressInput},

    active: {type: GraphQLNonNull(GraphQLBoolean)},

    properties: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLMetadataPropertyInput)))},

    roleIDs: {type: GraphQLList(GraphQLNonNull(GraphQLString))}
  }
})

export const GraphQLPublicUserInput = new GraphQLInputObjectType({
  name: 'UserInput',
  fields: {
    name: {type: GraphQLNonNull(GraphQLString)},
    firstName: {type: GraphQLString},
    email: {type: GraphQLNonNull(GraphQLString)},

    preferredName: {type: GraphQLString},
    address: {type: GraphQLUserAddressInput}
  }
})

export const GraphQLPaymentProviderCustomerInput = new GraphQLInputObjectType({
  name: 'PaymentProviderCustomerInput',
  fields: {
    paymentProviderID: {type: GraphQLNonNull(GraphQLString)},
    customerID: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLUserSession = new GraphQLObjectType({
  name: 'UserSession',
  fields: {
    token: {type: GraphQLNonNull(GraphQLString)},
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    expiresAt: {type: GraphQLNonNull(GraphQLDateTime)}
  }
})

export const GraphQLMemberRegistration = new GraphQLObjectType({
  name: 'Registration',
  fields: {
    user: {type: GraphQLNonNull(GraphQLPublicUser)},
    session: {type: GraphQLNonNull(GraphQLUserSession)}
  }
})

export const GraphQLMemberRegistrationAndPayment = new GraphQLObjectType({
  name: 'RegistrationAndPayment',
  fields: {
    payment: {type: GraphQLNonNull(GraphQLPublicPayment)},
    user: {type: GraphQLNonNull(GraphQLPublicUser)},
    session: {type: GraphQLNonNull(GraphQLUserSession)}
  }
})
