import {GraphQLPeer} from './peer'
import {createProxyingResolver} from '../utility'
import {GraphQLArticle, GraphQLPublicArticle} from './article'
import {GraphQLObjectType, GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLDateTime} from 'graphql-iso-date'

export const GraphQLArticlePeerInformation = new GraphQLObjectType({
  name: 'ArticlePeerInformation',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLDateTime},
    peer: {
      type: GraphQLNonNull(GraphQLPeer),
      resolve: createProxyingResolver((peerId, {loaders}) => loaders.peer.load(peerId))
    },
    producerArticle: {
      type: GraphQLNonNull(GraphQLArticle),
      resolve: createProxyingResolver((articleId, {loaders}) => {
        loaders.article.load(articleId)
      })
    },
    consumerArticle: {
      type: GraphQLNonNull(GraphQLPublicArticle),
      resolve: createProxyingResolver((articleId, {loaders, prisma}) =>
        loaders.peerArticle.load(articleId)
      )
    }
  }
})
