import {GraphQLObjectType, GraphQLNonNull, GraphQLString, GraphQLInt} from 'graphql'

export const GraphQLUser = new GraphQLObjectType({
  name: 'User',
  fields: {
    email: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLSession = new GraphQLObjectType({
  name: 'Session',
  fields: {
    user: {type: GraphQLNonNull(GraphQLUser)},
    token: {type: GraphQLNonNull(GraphQLString)},
    expiresIn: {type: GraphQLNonNull(GraphQLInt)}
  }
})
