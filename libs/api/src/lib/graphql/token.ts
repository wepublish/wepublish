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
    name: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLToken = new GraphQLObjectType<Token, Context>({
  name: 'Token',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    name: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLCreatedToken = new GraphQLObjectType<Token, Context>({
  name: 'CreatedToken',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    name: {type: GraphQLNonNull(GraphQLString)},
    token: {type: GraphQLNonNull(GraphQLString)}
  }
})
