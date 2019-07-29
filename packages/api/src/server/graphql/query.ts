import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLID,
  GraphQLInt,
  GraphQLInputObjectType,
  GraphQLBoolean
} from 'graphql'

import {GraphQLDateTime} from 'graphql-iso-date'

import GraphQLArticle from './article'
import GraphQLPeer from './peer'

import Context from '../context'

import {ArticleArguments, ArticlesArguments, PeersArguments, PeerArguments} from '../adapter'

// export const ArticleEdge = new GraphQLObjectType({
//   name: 'ArticleEdge',
//   fields: {
//     node: {type: Article}
//   }
// })

export const GraphQLDateRange = new GraphQLObjectType({
  name: 'DateRange',
  fields: {
    start: {type: GraphQLNonNull(GraphQLDateTime)},
    end: {type: GraphQLNonNull(GraphQLDateTime)}
  }
})

export const GraphQLDateRangeInput = new GraphQLInputObjectType({
  name: 'DateRangeInput',
  fields: {
    start: {type: GraphQLNonNull(GraphQLDateTime)},
    end: {type: GraphQLNonNull(GraphQLDateTime)}
  }
})

export const GraphQLDatePageInfo = new GraphQLObjectType({
  name: 'DatePageInfo',
  fields: {
    dateRange: {type: GraphQLDateRange}
  }
})

export const GraphQLArticleConnection = new GraphQLObjectType({
  name: 'ArticleConnection',
  fields: {
    nodes: {type: new GraphQLList(GraphQLArticle)},
    pageInfo: {
      type: GraphQLDatePageInfo
    },
    totalCount: {type: GraphQLInt}
  }
})

export const GraphQLQuery = new GraphQLObjectType({
  name: 'Query',
  fields: {
    article: {
      type: GraphQLArticle,
      args: {
        id: {
          description: 'ID of the Article.',
          type: GraphQLString
        }
      },
      resolve(_root, args, context: Context) {
        return context.adapter.getArticle(args)
      }
    },
    articles: {
      type: new GraphQLNonNull(GraphQLArticleConnection),
      args: {
        limit: {
          type: GraphQLInt
        },

        dateRange: {
          type: GraphQLNonNull(GraphQLDateRangeInput)
        },

        tagsInclude: {
          description: 'A list of tags to match against the Article.',
          type: GraphQLList(GraphQLString)
        },

        includePeers: {
          description: 'Should peers also be fetched.',
          type: GraphQLBoolean
        }
      },
      resolve(_root, args, context: Context) {
        // TODO: Fetch peers aswell
        const peers = context.adapter.getPeers({})

        for (const peer of peers) {
          peer.url
        }

        return context.adapter.getArticles(args as ArticlesArguments)
      }
    },

    peer: {
      type: GraphQLPeer,
      args: {
        id: {
          description: 'ID of the Peer.',
          type: GraphQLNonNull(GraphQLString)
        }
      },
      resolve(_root, args: PeerArguments, context: Context) {
        return context.adapter.getPeer(args)
      }
    },
    peers: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPeer))),
      resolve(_root, args: PeersArguments, context: Context) {
        return context.adapter.getPeers(args)
      }
    }
  }
})

export default GraphQLQuery
