import {delegateToPeerSchema} from '../../utility'
import {GraphQLResolveInfo} from 'graphql'
import {Context} from '../../context'
import {Article} from '../../db/article'

// peered articles
export const retrieveArticleById = async (
  // peerArticle: Article,
  id: string,
  peerId: string,
  context: Context,
  info: GraphQLResolveInfo
  // articleClient: PrismaClient['article']
): Promise<Article> => {
  const peerArticle = await delegateToPeerSchema(peerId, true, context, {
    fieldName: 'article',
    args: {id},
    info
  })
  // todo create article
  return peerArticle
}
