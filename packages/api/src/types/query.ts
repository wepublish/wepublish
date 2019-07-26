import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLID,
  GraphQLInt
} from 'graphql'

import articleType from './article'
import peerType from './peer'

import Context from '../context'

import {ArticleArguments, ArticlesArguments, PeersArguments, PeerArguments} from '../adapter'

export const queryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    article: {
      type: articleType,
      args: {
        id: {
          description: 'ID of the Article.',
          type: GraphQLString
        }
      },
      resolve(_root, args: ArticleArguments, context: Context) {
        return context.adapter.getArticle(args)
      }
    },
    articles: {
      type: new GraphQLNonNull(
        new GraphQLObjectType({
          name: 'Articles',
          fields: {
            edges: {
              type: new GraphQLList(
                new GraphQLObjectType({
                  name: 'ArticleEdge',
                  fields: {
                    node: {type: articleType},
                    cursor: {type: GraphQLString}
                  }
                })
              )
            },
            info: {
              type: new GraphQLObjectType({
                name: 'ArticlePageInfo',
                fields: {
                  startCursor: {type: GraphQLString},
                  endCursor: {type: GraphQLString},
                  totalCount: {type: GraphQLInt}
                }
              })
            }
          }
        })
      ),
      args: {
        first: {
          type: GraphQLInt
        },
        after: {
          type: GraphQLString
        }

        // tagsInclude: {
        //   description: 'A list of tags to match against the Article.',
        //   type: GraphQLList(GraphQLString)
        // },
        // peerID: {
        //   description: 'Peer ID of the Article.',
        //   type: GraphQLID
        // }
      },
      resolve(_root, args: any, context: Context) {
        // TODO: Fetch peers aswell
        // context.adapter.getPeers()
        return context.adapter.getArticles(args)
      }
    },
    peer: {
      type: peerType,
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
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(peerType))),
      resolve(_root, args: PeersArguments, context: Context) {
        return context.adapter.getPeers(args)
      }
    }
  }
})

export default queryType
