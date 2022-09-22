import {delegateToPeerSchema} from '../../utility'
import {GraphQLResolveInfo} from 'graphql'
import {Context} from '../../context'

// peered articles
export async function savePeerArticleById(
  id: string,
  peerId: string,
  context: Context,
  info: GraphQLResolveInfo
) {
  const peerArticle = await delegateToPeerSchema(peerId, true, context, {
    fieldName: 'article',
    args: {id},
    info
  })

  if (!peerArticle) throw new Error('peer article not found')
  console.log('peer article', peerArticle)
  const {published} = peerArticle
  const {blocks} = published

  console.log('published', JSON.stringify(published))
  console.log('blocks', JSON.stringify(blocks))

  // const {blocks} = published
  // const strippedBlocks = blocks.map((block: any) => { return delete block.__typename})
  // console.log('blocks', strippedBlocks)
  // TODO authenticate
  // todo check peer version

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
