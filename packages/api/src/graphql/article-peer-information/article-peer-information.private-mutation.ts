import {Context} from '../../context'
import {ApolloClient, InMemoryCache} from '@apollo/client/core'
import {SchemaLink} from '@apollo/client/link/schema'
import gql from 'graphql-tag'

export async function getPeerApolloClient(
  peerID: string,
  fetchAdminEndpoint: boolean,
  context: Context
) {
  const schema = fetchAdminEndpoint
    ? await context.loaders.peerAdminSchema.load(peerID)
    : await context.loaders.peerSchema.load(peerID)

  if (!schema) return null

  const schemaLink = new SchemaLink({schema})
  return new ApolloClient({
    link: schemaLink,
    cache: new InMemoryCache()
  })
}

// peered articles
export async function savePeerArticleById(id: string, peerID: string, context: Context) {
  const client = await getPeerApolloClient(peerID, true, context)
  const peerArticle = await client?.query({
    variables: {
      id: id,
      peerID: peerID
    },
    query: gql`
      query PeerArticle($id: ID!, $peerID: ID!) {
        peerArticle(id: $id, peerID: $peerID) {
          id
          published {
            title
          }
        }
      }
    `
  })
  console.log('apollo article', await JSON.stringify(peerArticle))

  /*
  TODO create article
  const val = await context.prisma.article.create({
    data: {
      shared: false,
      draft: {
        create:
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

 */
  return null
}
