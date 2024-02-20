import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLInputObjectType,
  GraphQLID
} from 'graphql'

import {Context} from '../context'
import {GraphQLDateTime} from 'graphql-scalars'
import {Token} from '@prisma/client'

export const GraphQLTokenInput = new GraphQLInputObjectType({
  name: 'TokenInput',
  fields: {
    name: {type: new GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLToken = new GraphQLObjectType<Token, Context>({
  name: 'Token',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},

    createdAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: new GraphQLNonNull(GraphQLDateTime)},

    name: {type: new GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLCreatedToken = new GraphQLObjectType<Token, Context>({
  name: 'CreatedToken',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},

    createdAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: new GraphQLNonNull(GraphQLDateTime)},

    name: {type: new GraphQLNonNull(GraphQLString)},
    token: {type: new GraphQLNonNull(GraphQLString)}
  }
})
