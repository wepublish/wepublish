import {delegateToPeerSchema} from '../../utility'
import {GraphQLResolveInfo} from 'graphql'
import {Context} from '../../context'

// peered articles
export async function savePeerArticleById(
  id: string,
  peerID: string,
  context: Context,
  info: GraphQLResolveInfo
) {
  console.log('id', id)
  console.log('peerID', peerID)
  const peerArticle = await delegateToPeerSchema(peerID, true, context, {
    fieldName: 'article',
    args: {id},
    info
  })
  // console.log('peerArticle', peerArticle)
  if (!peerArticle) throw new Error('peer article not found')
  // console.log('peer article', peerArticle)
  const {published, peerInformation} = peerArticle
  // const {blocks} = published
  console.log('peerInformation', peerInformation)

  // console.log('published', JSON.stringify(published))
  // console.log('blocks', JSON.stringify(blocks))

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
  console.log('val', val)
  return val
}
