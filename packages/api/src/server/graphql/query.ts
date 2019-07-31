import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLError
} from 'graphql'

import {GraphQLDateRangeInput} from './dateRange'
import {GraphQLArticle, GraphQLArticleConnection} from './article'
import {GraphQLPeer, GraphQLPeerConnection} from './peer'

import {Context} from '../context'

import {ArticlesArguments, PeersArguments, PeerArguments, ArticleArguments} from '../adapter'
import {queryArticles} from '../../client'

export const GraphQLQuery = new GraphQLObjectType({
  name: 'Query',
  fields: {
    article: {
      type: GraphQLNonNull(GraphQLArticle),
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
      type: GraphQLNonNull(GraphQLArticleConnection),
      description: 'Request articles based on a date range.',

      args: {
        limit: {
          type: GraphQLInt,
          description:
            'Limit the number of articles being returned. ' +
            "Note that there's no way to paginate to the remaining articles, " +
            '`limit` should only be used when you need to request a fixed number of articles.'
        },

        publishedBetween: {
          type: GraphQLDateRangeInput,
          description:
            'Get articles published between a date range. ' +
            'Mutally exclusive with `updatedBetween` and `createdBetween`'
        },

        updatedBetween: {
          type: GraphQLDateRangeInput,
          description:
            'Get articles updated between a date range. ' +
            'Mutally exclusive with `publishedBetween` and `createdBetween`'
        },

        createdBetween: {
          type: GraphQLDateRangeInput,
          description:
            'Get articles created between a date range. ' +
            'Mutally exclusive with `updatedBetween` and `publishedBetween`'
        },

        tagsInclude: {
          description: 'A list of tags to match against the article.',
          type: GraphQLList(GraphQLString)
        },

        includePeers: {
          description: 'Should articles of peers also be fetched.',
          type: GraphQLBoolean,
          defaultValue: true
        }
      },
      async resolve(_root, args, context: Context) {
        const {
          publishedBetween,
          createdBetween,
          updatedBetween,
          includePeers
        } = args as ArticlesArguments

        if (
          (publishedBetween && createdBetween && updatedBetween) ||
          (publishedBetween && createdBetween) ||
          (publishedBetween && updatedBetween) ||
          (createdBetween && updatedBetween)
        ) {
          return new Error(
            '`publishedBetween`, `createdBetween` and `updatedBetween` are mutally exclusive.'
          )
        }

        if (includePeers) {
          // TODO: Fetch peers aswell
          const peers = await context.adapter.getPeers({})
          const peerArticles: any[] = []

          for (const peer of peers) {
            const result = await queryArticles(peer.url)
            peerArticles.push(...result.data.nodes.map((article: any) => ({...article, peer})))
          }
        }

        const articles = context.adapter.getArticles(args as ArticlesArguments)

        return {
          nodes: articles,
          pageInfo: {
            publishedBetween,
            createdBetween,
            updatedBetween
          }
        }
      }
    },

    peer: {
      type: GraphQLNonNull(GraphQLPeer),
      args: {
        id: {
          description: 'ID of the peer.',
          type: GraphQLNonNull(GraphQLString)
        }
      },
      resolve(_root, args: PeerArguments, context: Context) {
        return context.adapter.getPeer(args)
      }
    },
    peers: {
      type: GraphQLNonNull(GraphQLPeerConnection),
      resolve(_root, args: PeersArguments, context: Context) {
        return context.adapter.getPeers(args)
      }
    }
  }
})

export default GraphQLQuery
