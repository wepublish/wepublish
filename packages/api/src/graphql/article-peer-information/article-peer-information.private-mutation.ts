import {delegateToPeerSchema} from '../../utility'
import {GraphQLResolveInfo} from 'graphql'
import {Context} from '../../context'

// peered articles
export const savePeerArticleById = async (
  id: string,
  peerId: string,
  context: Context,
  info: GraphQLResolveInfo
) => {
  const peerArticle = await delegateToPeerSchema(peerId, true, context, {
    fieldName: 'article',
    args: {id},
    info
  })

  if (!peerArticle.published) throw new Error('peer article not found')
  console.log('published', peerArticle.published)
  const {published} = peerArticle.published

  // TODO authenticate

  const val = await context.prisma.article.create({
    data: {
      shared: false,

      draft: {
        create: {
          ...published,
          breaking: false,
          hideAuthor: false
        }
      }
      // peeringInfo: {
      //    create: {
      //   peerId: peerId,
      //      producerArticleId: id,
      //      peer: peerArticle.peer
      //   }}
    }
  })
  return val
}
