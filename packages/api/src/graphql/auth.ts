import {GraphQLID, GraphQLNonNull, GraphQLObjectType, GraphQLString} from 'graphql'

export const GraphQLOAuth2Provider = new GraphQLObjectType({
  name: 'Oauth2Provider',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    name: {type: GraphQLNonNull(GraphQLString)},
    clientId: {type: GraphQLNonNull(GraphQLString)},
    scope: {type: GraphQLNonNull(GraphQLString)}
  }
})
