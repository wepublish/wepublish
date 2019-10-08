import {GraphQLObjectType, GraphQLNonNull, GraphQLString} from 'graphql'

export const GraphQLUserSession = new GraphQLObjectType({
  name: 'Session',
  fields: {
    username: {type: GraphQLNonNull(GraphQLString)},
    token: {type: GraphQLNonNull(GraphQLString)}
  }
})
