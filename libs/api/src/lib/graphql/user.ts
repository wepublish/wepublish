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
import {UserSort, UserWithRelations} from '../db/user'
import {
  GraphQLMetadataProperty,
  GraphQLMetadataPropertyPublic,
  GraphQLMetadataPropertyInput,
  GraphQLPageInfo
} from './common'
import {Context} from '../context'
import {GraphQLUserRole} from './userRole'
import {GraphQLDateTime} from 'graphql-scalars'
import {GraphQLPublicPayment} from './payment'
import {Subscription, User} from '@prisma/client'
import {GraphQLMemberPlan, GraphQLPaymentPeriodicity, GraphQLSupportedCurrency} from './memberPlan'
import {GraphQLSubscriptionDeactivation} from './subscriptionDeactivation'
import {GraphQLSubscriptionPeriod} from './subscriptionPeriods'
import {GraphQLInvoice} from './invoice'
import {createProxyingResolver} from '../utility'
import {GraphQLImage, GraphQLUploadImageInput} from './image'
import {isMeBySession} from './utils'

export const GraphQLUserAddress = new GraphQLObjectType({
  name: 'UserAddress',
  fields: {
    company: {type: GraphQLString},
    streetAddress: {type: GraphQLString},
    streetAddress2: {type: GraphQLString},
    zipCode: {type: GraphQLString},
    city: {type: GraphQLString},
    country: {type: GraphQLString}
  }
})

export const GraphQLPaymentProviderCustomer = new GraphQLObjectType({
  name: 'PaymentProviderCustomer',
  fields: {
    paymentProviderID: {type: new GraphQLNonNull(GraphQLString)},
    customerID: {type: new GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLOAuth2Account = new GraphQLObjectType({
  name: 'OAuth2Account',
  fields: {
    type: {type: new GraphQLNonNull(GraphQLString)},
    provider: {type: new GraphQLNonNull(GraphQLString)},
    scope: {type: new GraphQLNonNull(GraphQLString)}
  }
})

const GraphQLUserSubscription = new GraphQLObjectType<Subscription, Context>({
  name: 'UserSubscription',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},
    createdAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    paymentPeriodicity: {type: new GraphQLNonNull(GraphQLPaymentPeriodicity)},
    monthlyAmount: {type: new GraphQLNonNull(GraphQLInt)},
    currency: {type: new GraphQLNonNull(GraphQLSupportedCurrency)},
    autoRenew: {type: new GraphQLNonNull(GraphQLBoolean)},
    startsAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    paidUntil: {type: GraphQLDateTime},
    properties: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLMetadataProperty)))
    },
    deactivation: {type: GraphQLSubscriptionDeactivation},
    periods: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLSubscriptionPeriod)))
    },
    memberPlan: {
      type: new GraphQLNonNull(GraphQLMemberPlan),
      resolve({memberPlanID}, args, {prisma}) {
        return prisma.memberPlan.findUnique({
          where: {
            id: memberPlanID
          }
        })
      }
    },
    invoices: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLInvoice))),
      resolve({id: subscriptionId}, args, {prisma}) {
        return prisma.invoice.findMany({
          where: {
            subscriptionID: subscriptionId
          },
          include: {
            items: true
          }
        })
      }
    }
  }
})

export const GraphQLUser = new GraphQLObjectType<User, Context>({
  name: 'User',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLString)},

    createdAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: new GraphQLNonNull(GraphQLDateTime)},

    name: {type: new GraphQLNonNull(GraphQLString)},
    firstName: {type: GraphQLString},
    email: {type: new GraphQLNonNull(GraphQLString)},
    emailVerifiedAt: {type: GraphQLDateTime},
    birthday: {type: GraphQLDateTime},

    address: {type: GraphQLUserAddress},
    flair: {type: GraphQLString},

    userImage: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({userImageID}, _, {prisma: {image}}) =>
        userImageID
          ? image.findUnique({
              where: {
                id: userImageID
              }
            })
          : null
      )
    },

    active: {type: new GraphQLNonNull(GraphQLBoolean)},
    lastLogin: {type: GraphQLDateTime},

    properties: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLMetadataProperty)))
    },

    roles: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLUserRole))),
      resolve({roleIDs}, args, {loaders}) {
        return Promise.all(roleIDs.map(roleID => loaders.userRolesByID.load(roleID)))
      }
    },
    paymentProviderCustomers: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLPaymentProviderCustomer)))
    },
    oauth2Accounts: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLOAuth2Account)))
    },
    subscriptions: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLUserSubscription))),
      resolve: createProxyingResolver(({id: userId}, _, {prisma}) => {
        return prisma.subscription.findMany({
          where: {
            userID: userId
          },
          include: {
            deactivation: true,
            periods: true,
            properties: true
          }
        })
      })
    }
  }
})

export const GraphQLPublicUser = new GraphQLObjectType<UserWithRelations, Context>({
  name: 'User',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLString)},
    name: {type: new GraphQLNonNull(GraphQLString)},
    firstName: {type: GraphQLString},
    birthday: {
      type: GraphQLDateTime,
      resolve: createProxyingResolver(({birthday, id}, _, {session}) =>
        birthday && isMeBySession(id, session) ? birthday : null
      )
    },
    email: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: createProxyingResolver(({email, id}, _, {session}) =>
        email && isMeBySession(id, session) ? email : ''
      )
    },
    address: {
      type: GraphQLUserAddress,
      resolve: createProxyingResolver(({address, id}, _, {session}) =>
        address && isMeBySession(id, session) ? address : ''
      )
    },
    flair: {type: GraphQLString},
    paymentProviderCustomers: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLPaymentProviderCustomer))),
      resolve: createProxyingResolver(({id, paymentProviderCustomers}, _, {session}) =>
        id && isMeBySession(id, session) ? paymentProviderCustomers : []
      )
    },
    oauth2Accounts: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLOAuth2Account))),
      resolve: createProxyingResolver(({id, oauth2Accounts}, _, {session}) =>
        id && isMeBySession(id, session) ? oauth2Accounts : []
      )
    },
    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({userImageID}, _, {prisma: {image}}) =>
        userImageID
          ? image.findUnique({
              where: {
                id: userImageID
              }
            })
          : null
      )
    },
    properties: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLMetadataPropertyPublic))),
      resolve: ({properties}) =>
        properties.filter(property => property.public).map(({key, value}) => ({key, value}))
    }
  }
})

export const GraphQLUserFilter = new GraphQLInputObjectType({
  name: 'UserFilter',
  fields: {
    name: {type: GraphQLString},
    text: {type: GraphQLString},
    userRole: {type: new GraphQLList(GraphQLString)}
  }
})

export const GraphQLUserSort = new GraphQLEnumType({
  name: 'UserSort',
  values: {
    [UserSort.CreatedAt]: {value: UserSort.CreatedAt},
    [UserSort.ModifiedAt]: {value: UserSort.ModifiedAt},
    [UserSort.Name]: {value: UserSort.Name},
    [UserSort.FirstName]: {value: UserSort.FirstName}
  }
})

export const GraphQLUserConnection = new GraphQLObjectType<any, Context>({
  name: 'UserConnection',
  fields: {
    nodes: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLUser)))},
    pageInfo: {type: new GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: new GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLUserAddressInput = new GraphQLInputObjectType({
  name: 'UserAddressInput',
  fields: {
    company: {type: GraphQLString},
    streetAddress: {type: GraphQLString},
    streetAddress2: {type: GraphQLString},
    zipCode: {type: GraphQLString},
    city: {type: GraphQLString},
    country: {type: GraphQLString}
  }
})

export const GraphQLUserInput = new GraphQLInputObjectType({
  name: 'UserInput',
  fields: {
    name: {type: new GraphQLNonNull(GraphQLString)},
    firstName: {type: GraphQLString},
    email: {type: new GraphQLNonNull(GraphQLString)},
    emailVerifiedAt: {type: GraphQLDateTime},

    birthday: {
      type: GraphQLDateTime
    },
    address: {type: GraphQLUserAddressInput},
    flair: {type: GraphQLString},

    userImageID: {type: GraphQLID},

    active: {type: new GraphQLNonNull(GraphQLBoolean)},

    properties: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLMetadataPropertyInput)))
    },

    roleIDs: {type: new GraphQLList(new GraphQLNonNull(GraphQLString))}
  }
})

export const GraphQLPublicUserInput = new GraphQLInputObjectType({
  name: 'UserInput',
  fields: {
    name: {type: new GraphQLNonNull(GraphQLString)},
    firstName: {type: GraphQLString},
    email: {type: new GraphQLNonNull(GraphQLString)},
    address: {type: GraphQLUserAddressInput},
    flair: {type: GraphQLString},
    birthday: {
      type: GraphQLDateTime
    },
    uploadImageInput: {type: GraphQLUploadImageInput}
  }
})

export const GraphQLPaymentProviderCustomerInput = new GraphQLInputObjectType({
  name: 'PaymentProviderCustomerInput',
  fields: {
    paymentProviderID: {type: new GraphQLNonNull(GraphQLString)},
    customerID: {type: new GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLUserSession = new GraphQLObjectType({
  name: 'UserSession',
  fields: {
    token: {type: new GraphQLNonNull(GraphQLString)},
    createdAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    expiresAt: {type: new GraphQLNonNull(GraphQLDateTime)}
  }
})

export const GraphQLMemberRegistration = new GraphQLObjectType({
  name: 'Registration',
  fields: {
    user: {type: new GraphQLNonNull(GraphQLPublicUser)},
    session: {type: new GraphQLNonNull(GraphQLUserSession)}
  }
})

export const GraphQLMemberRegistrationAndPayment = new GraphQLObjectType({
  name: 'RegistrationAndPayment',
  fields: {
    payment: {type: new GraphQLNonNull(GraphQLPublicPayment)},
    user: {type: new GraphQLNonNull(GraphQLPublicUser)},
    session: {type: new GraphQLNonNull(GraphQLUserSession)}
  }
})
