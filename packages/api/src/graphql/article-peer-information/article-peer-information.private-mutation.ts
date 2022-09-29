import {GraphQLResolveInfo} from 'graphql'
import {Context} from '../../context'
import {ApolloClient, InMemoryCache} from '@apollo/client/core'
import {SchemaLink} from '@apollo/client/link/schema'
import gql from 'graphql-tag'

// peered articles
export async function savePeerArticleById(
  id: string,
  peerID: string,
  context: Context,
  info: GraphQLResolveInfo
) {
  /*
  const peerArticle = await delegateToPeerSchema(peerID, true, context, {
    fieldName: 'article',
    args: {id},
    info,
    operation: 'query'
  })
  console.log(info.fieldNodes[0])

  if (!peerArticle.published) throw new NotFound('peer article', id)
  // const {published} = peerArticle
  // console.log('published', published)

  const {
    id: _id,
    updatedAt: _updatedAt,
    createdAt: _createdAt,
    publishedAt: _publishedAt,
    slug: _slug,
    properties,
    blocks,
    ...articleRevision
  } = (peerArticle.published)

  const duplicatedProperties = properties?.map((property: any) => ({
    key: property.key,
    value: property.value,
    public: property.public
  }))
  console.log('duplicated props', duplicatedProperties)

  blocks?.map((block: any) => { return delete block.__typename})
  console.log('blocks', blocks)
  const duplicatedBlocks = blocks?.map((block: any) => {
    // console.log(block.__typename)
    return {
        title: block.title ? block.title : undefined,
        lead: block.lead ? block.lead : undefined,

  }})

console.log('duplicated blocks', duplicatedBlocks)
  const input: Prisma.ArticleRevisionCreateInput = {
    ...articleRevision,
    properties: {
      createMany: {
        data: duplicatedProperties
      },
      blocks: {
        createMany: {
          data: blocks
        }
      }
    }
  }
*/

  const apolloClient = (await getPeerApolloClient(peerID, true, context))?.query({
    query: gql`
      query {
        peerArticle(id: "cl8a2jgiz55449401qna90j0mfx", peerID: "cl88ldic70983bv2r9jda5hux") {
          id
        }
      }
    `
  })
  console.log('apollo client', await apolloClient)

  /*
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
    headers: {Authorization: 'Bearer Vp4HyACBrkHkTD3Lu4c6wKkL4jxDfUqm'},
    cache: new InMemoryCache()
  })
}

export const peerArticleMetaDataFragment = gql`
  fragment PeerArticleMetaData on Article {
    __typename
    id
    url

    updatedAt
    publishedAt

    slug
    preTitle
    title
    lead
    breaking
    tags

    canonicalUrl

    socialMediaTitle
    socialMediaDescription
  }
`
