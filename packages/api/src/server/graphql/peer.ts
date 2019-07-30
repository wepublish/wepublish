import {GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLArticleConnection} from './article'

export const GraphQLPeer: GraphQLObjectType = new GraphQLObjectType({
  name: 'Peer',

  fields: () => ({
    id: {
      type: GraphQLNonNull(GraphQLID)
    },
    name: {
      type: GraphQLNonNull(GraphQLString)
    },
    url: {
      type: GraphQLNonNull(GraphQLString)
    },
    articles: {
      type: GraphQLArticleConnection
    }
  })
})
