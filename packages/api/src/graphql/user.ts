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
import {GraphQLMetadataProperty, GraphQLMetadataPropertyInput, GraphQLPageInfo} from './common'
import {Context} from '../context'
import {GraphQLUserRole} from './userRole'
import {GraphQLDateTime} from 'graphql-iso-date'

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
