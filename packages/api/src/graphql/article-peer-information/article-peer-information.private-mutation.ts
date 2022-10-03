import {Context} from '../../context'
import {ApolloClient, InMemoryCache} from '@apollo/client/core'
import {SchemaLink} from '@apollo/client/link/schema'
import gql from 'graphql-tag'
import {NotFound} from '../../error'
import {ArticleRevision} from '../../db/article'

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
      id
    },
    query: peerArticleQuery
  })

  if (!peerArticle?.data) throw new NotFound('Peer Article', peerID)
  const data: ArticleRevision = peerArticle.data.article.published
  // console.log('apollo article', await JSON.stringify(peerArticle.data))
  console.log('published', data)
  const val = await context.prisma.article.create({
    data: {
      shared: false,
      draft: {
        create: data
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

export const peerArticleQuery = gql`
  query Article($id: ID!) {
    article(id: $id) {
      __typename
      id
      published {
        title
        lead
        revision
        createdAt
        publishAt
        updatedAt
        publishedAt
        hideAuthor
        preTitle
        breaking
        seoTitle
        slug
        tags
        canonicalUrl
        url
        properties {
          key
          value
          public
        }
        blocks {
          ... on RichTextBlock {
            richText
          }
          ... on TitleBlock {
            title
            lead
          }
          ... on ImageBlock {
            image {
              id
            }
            caption
          }
        }
        ... on ImageGalleryBlock {
          images {
            caption
          }
        }
        ... on ListicleBlock {
          items {
            title
            image {
              id
            }
            richText
          }
        }
        ... on FacebookPostBlock {
          userID
          postID
        }
        ... on FacebookVideoBlock {
          userID
          videoID
        }
        ... on InstagramBlock {
          postID
        }
        ... on TwitterTweetBlock {
          userID
          tweetID
        }
        ... on VimeoVideoBlock {
          videoID
        }
        ... on YouTubeVideoBlock {
          videoID
        }
        ... on SoundCloudTrackBlock {
          trackID
        }
        ... on PolisConversationBlock {
          conversationID
        }
        ... on TikTokVideoBlock {
          videoID
          userID
        }
        ... on BildwurfAdBlock {
          zoneID
        }
        ... on EmbedBlock {
          url
          title
          width
          height
          styleCustom
          sandbox
        }
        ... on HTMLBLock {
          html
        }
        ... on PollBlock {
          poll {
            id
          }
        }
        ... on CommentBlock {
          comments {
            id
          }
          filter {
            item
            tags
            comments
          }
        }
        ... on LinkPageBreakBlock {
          text
          richText
          linkURL
          linkText
          linkTarget
          hideButton
          styleOption
          layoutOption
          templateOption
          image {
            id
          }
        }
        ... on QuoteBlock {
          quote
          author
        }
        ... on TeaserGridBlock {
          numColumns
        }
        ... on TeaserGridFlexBlock {
          flexTeasers {
            alignment {
              i
              x
              y
              w
              h
              static
            }
          }
        }
      }
    }
  }
`
