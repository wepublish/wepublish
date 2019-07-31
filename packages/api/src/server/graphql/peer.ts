import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLID,
  GraphQLList,
  GraphQLInt
} from 'graphql'

import {GraphQLArticleConnection} from './article'
import {GraphQLPageInfo} from './pageInfo'

export const GraphQLPeer = new GraphQLObjectType({
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

export const GraphQLPeerEdge = new GraphQLObjectType({
  name: 'PeerEdge',
  fields: {
    node: {type: GraphQLPeer},
    cursor: {type: GraphQLString}
  }
})

export const GraphQLPeerConnection: GraphQLObjectType = new GraphQLObjectType({
  name: 'PeerConnection',
  fields: {
    edges: {type: GraphQLList(GraphQLPeerEdge)},
    nodes: {type: GraphQLList(GraphQLPeer)},
    pageInfo: {
      type: GraphQLNonNull(GraphQLPageInfo)
    },
    totalCount: {type: GraphQLInt}
  }
})
