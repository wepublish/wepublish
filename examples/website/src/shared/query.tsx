import gql from 'graphql-tag'
import {QueryHookOptions, useQuery} from '@apollo/client'
import {ArticleReference, PageInfo, ImageRefData} from './types'
import {
  imageBlockDataFragment,
  richTextBlockDataFragment,
  imageGalleryBlockDataFragment,
  facebookPostBlockDataFragment,
  instagramPostBlockDataFragment,
  twitterTweetBlockDataFragment,
  vimeoVideoBlockDataFragment,
  youtubeVideoBlockDataFragment,
  soundCloudTrackBlockDataFragment,
  embedBlockDataFragment,
  linkPageBreakBlockDataFragment,
  listicleBlockDataFragment,
  quoteBlockDataFragment,
  titleBlockDataFragment,
  articleMetaDataFragment,
  simpleImageDataFragment,
  gridBlockFrontDataGQLfragment
} from './route/gqlFragments'

// TODO: Don't use slate Node type, export client side friendly types from @wepublish/api/types package.
// TODO: Remove slate from dependencies.
import {Node} from 'slate'

// Article-Queries
// ===============

export interface ListArticlesData {
  articles: {
    nodes: ArticleReference[]
    pageInfo: PageInfo
    totalCount: number
  }
}

export interface ListArticlesVariables {
  first: number
  cursor?: string | null
  filter?: string[]
  authors?: string[]
}

const ArticleTagQuery = gql`
  query ArticleTag($first: Int, $authors: [ID!], $filter: [String!], $cursor: ID) {
    articles(first: $first, after: $cursor, filter: {tags: $filter, authors: $authors}) {
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      totalCount
      nodes {
        id
        ...ArticleMetaData
      }
    }
  }
  ${articleMetaDataFragment}
`

export const ArticleQuery = gql`
  query Article($id: ID!) {
    article(id: $id) {
      ...ArticleMetaData

      blocks {
        __typename
        ...RichtTextBlockData
        ...ImageBlockData
        ...ImageGalleryBlockData
        ...FacebookPostBlockData
        ...InstagramPostBlockData
        ...TwitterTweetBlockData
        ...VimeoVideoBlockData
        ...YoutubeVideoBlockData
        ...SoundCloudTrackBlockData
        ...EmbedBlockData
        ...LinkPageBreakBlockData
        ...ListicleBlockData
        ...QuoteBlockData
        ...TitleBlockData
        ...ArticleGridBlockData
      }
    }
  }

  ${articleMetaDataFragment}
  ${richTextBlockDataFragment}
  ${imageBlockDataFragment}
  ${imageGalleryBlockDataFragment}
  ${instagramPostBlockDataFragment}
  ${facebookPostBlockDataFragment}
  ${twitterTweetBlockDataFragment}
  ${vimeoVideoBlockDataFragment}
  ${youtubeVideoBlockDataFragment}
  ${soundCloudTrackBlockDataFragment}
  ${embedBlockDataFragment}
  ${linkPageBreakBlockDataFragment}
  ${listicleBlockDataFragment}
  ${quoteBlockDataFragment}
  ${titleBlockDataFragment}
  ${gridBlockFrontDataGQLfragment}
`

// Article-Mutations
// =================

export const AddComment = gql`
  mutation AddComment($input: CommentInput!) {
    addComment(input: $input) {
      user {
        id
      }
      text
      parentID
    }
  }
`

export const UpdateComment = gql`
  mutation UpdateComment($input: CommentUpdateInput!) {
    updateComment(input: $input) {
      id
      text
    }
  }
`

export function useListArticlesQuery(
  opts?: QueryHookOptions<ListArticlesData, ListArticlesVariables>
) {
  return useQuery(ArticleTagQuery, opts)
}

// Author-Queries
// ==============

export interface AuthorLink {
  title: string
  url: string
}

export interface Author {
  id: string
  name: string
  image?: ImageRefData
  links?: AuthorLink[]
  bio?: Node[]
}

export interface AuthorQueryVariables {
  id?: string
  slug?: string
}

export interface AuthorQueryData {
  authorByID?: Author
  authorBySlug?: Author
}

const AuthorQuery = gql`
  query Author($id: ID, $slug: Slug) {
    authorByID: author(id: $id) {
      id
      name
      image {
        ...SimpleImageData
      }
      links {
        title
        url
      }
      bio
    }
    authorBySlug: author(slug: $slug) {
      id
      name
      image {
        ...SimpleImageData
      }
      links {
        title
        url
      }
      bio
    }
  }
  ${simpleImageDataFragment}
`

export function useAuthorQuery(opts?: QueryHookOptions<AuthorQueryData, AuthorQueryVariables>) {
  return useQuery(AuthorQuery, opts)
}
