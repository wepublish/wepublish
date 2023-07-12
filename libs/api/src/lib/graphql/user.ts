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
import {GraphQLMemberPlan, GraphQLPaymentPeriodicity} from './memberPlan'
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
      resolve({memberPlanID}, args, {prisma}) {
        return prisma.memberPlan.findUnique({
          where: {
            id: memberPlanID
          }
        })
      }
    },
    invoices: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLInvoice))),
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
    id: {type: GraphQLNonNull(GraphQLString)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    name: {type: GraphQLNonNull(GraphQLString)},
    firstName: {type: GraphQLString},
    email: {type: GraphQLNonNull(GraphQLString)},
    emailVerifiedAt: {type: GraphQLDateTime},

    preferredName: {type: GraphQLString},
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

    active: {type: GraphQLNonNull(GraphQLBoolean)},
    lastLogin: {type: GraphQLDateTime},

    properties: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLMetadataProperty)))},

    roles: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLUserRole))),
      resolve({roleIDs}, args, {loaders}) {
        return Promise.all(roleIDs.map(roleID => loaders.userRolesByID.load(roleID)))
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
    id: {type: GraphQLNonNull(GraphQLString)},
    name: {type: GraphQLNonNull(GraphQLString)},
    firstName: {type: GraphQLString},
    email: {
      type: GraphQLNonNull(GraphQLString),
      resolve: createProxyingResolver(({email, id}, _, {session}) =>
        email && isMeBySession(id, session) ? email : ''
      )
    },
    preferredName: {type: GraphQLString},
    address: {
      type: GraphQLUserAddress,
      resolve: createProxyingResolver(({address, id}, _, {session}) =>
        address && isMeBySession(id, session) ? address : ''
      )
    },
    flair: {type: GraphQLString},
    paymentProviderCustomers: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPaymentProviderCustomer))),
      resolve: createProxyingResolver(({id, paymentProviderCustomers}, _, {session}) =>
        id && isMeBySession(id, session) ? paymentProviderCustomers : []
      )
    },
    oauth2Accounts: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLOAuth2Account))),
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
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLMetadataPropertyPublic))),
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
    userRole: {type: GraphQLList(GraphQLString)}
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
    name: {type: GraphQLNonNull(GraphQLString)},
    firstName: {type: GraphQLString},
    email: {type: GraphQLNonNull(GraphQLString)},
    emailVerifiedAt: {type: GraphQLDateTime},

    preferredName: {type: GraphQLString},
    address: {type: GraphQLUserAddressInput},
    flair: {type: GraphQLString},

    userImageID: {type: GraphQLID},

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
    address: {type: GraphQLUserAddressInput},
    flair: {type: GraphQLString},
    uploadImageInput: {type: GraphQLUploadImageInput}
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
