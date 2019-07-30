import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLBoolean
} from 'graphql'

import {GraphQLDateRangeInput} from './dateRange'
import {GraphQLArticle, GraphQLArticleConnection} from './article'
import {GraphQLPeer} from './peer'

import {Context} from '../context'

import {ArticlesArguments, PeersArguments, PeerArguments, ArticleArguments} from '../adapter'

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
        // return context.adapter.getArticle(args)
      }
    },
    articles: {
      type: new GraphQLNonNull(GraphQLArticleConnection),
      args: {
        limit: {
          type: GraphQLInt
        },

        publishedBetween: {
          type: GraphQLDateRangeInput
        },

        updatedBetween: {
          type: GraphQLDateRangeInput
        },

        createdBetween: {
          type: GraphQLDateRangeInput
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
        const articleArgs = args as ArticlesArguments

        // TODO: Fetch peers aswell
        const peers = context.adapter.getPeers({})

        for (const peer of peers) {
          peer.url
        }

        const articles = context.adapter.getArticles(articleArgs)

        return {
          nodes: articles,
          pageInfo: {
            publishedBetween: articleArgs.publishedBetween
          }
        }
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
