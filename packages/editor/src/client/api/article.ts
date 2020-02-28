import gql from 'graphql-tag'
import {useMutation, useQuery, QueryHookOptions, MutationHookOptions} from '@apollo/react-hooks'

import {VersionState} from './common'
import {ImageRefFragment, ImageRefData} from './image'
import {AuthorFragment} from './author'

export const ArticleMutationFragment = gql`
  fragment ArticleMutationFragment on Article {
    id
    publishedAt
    latest {
      version
    }
  }
`

export interface ArticleMutationData {
  id: string
  publishedAt?: string
  latest: {
    version: number
  }
}

export const ArticleRefFragment = gql`
  fragment ArticleRefFragment on Article {
    id

    createdAt
    modifiedAt

    published {
      publishedAt
      updatedAt
    }

    latest {
      title
      lead
      image {
        ...ImageRefFragment
      }
    }
  }

  ${ImageRefFragment}
`

export interface ArticleReference {
  id: string

  createdAt: string
  publishedAt?: string

  latest: {
    updatedAt: string
    state: VersionState
    title?: string
    lead?: string
    image?: ImageRefData
  }
}

// Query
// =====

const ListArticlesQuery = gql`
  query ListArticles {
    articles(first: $first) {
      nodes {
        ...ArticleRefFragment
      }
    }
  }

  ${ArticleRefFragment}
`

export interface ListArticlesData {
  articles: {
    nodes: ArticleReference[]
  }
}

export interface ListArticlesVariables {
  filter?: string
}

export function useListArticlesQuery(
  opts?: QueryHookOptions<ListArticlesData, ListArticlesVariables>
) {
  return useQuery<ListArticlesData, ListArticlesVariables>(ListArticlesQuery, opts)
}

// Mutation
// ========

export interface ArticleInput {
  slug: string
  preTitle?: string
  title: string
  lead: string
  tags: string[]
  imageID?: string
  authorIDs: string[]
  shared: boolean
  breaking: boolean
  blocks: any[]
}

const CreateArticleMutation = gql`
  mutation CreateArticle($input: ArticleInput!) {
    createArticle(input: $input) {
      ...ArticleMutationFragment
    }
  }

  ${ArticleMutationFragment}
`

export interface CreateArticleMutationData {
  createArticle: ArticleMutationData
}

export interface CreateArticleVariables {
  input: ArticleInput
}

export function useCreateArticleMutation() {
  return useMutation<CreateArticleMutationData, CreateArticleVariables>(CreateArticleMutation)
}

const UpdateArticleMutation = gql`
  mutation UpdateArticle($id: ID!, $input: ArticleInput!) {
    updateArticle(id: $id, input: $input) {
      ...ArticleMutationFragment
    }
  }

  ${ArticleMutationFragment}
`

export interface UpdateArticleMutationData {
  updateArticle: ArticleMutationData
}

export interface UpdateArticleVariables {
  id: string
  input: ArticleInput
}

export function useUpdateArticleMutation() {
  return useMutation<UpdateArticleMutationData, UpdateArticleVariables>(UpdateArticleMutation)
}

const PublishArticleMutation = gql`
  mutation PublishArticle(
    $id: ID!
    $version: Int!
    $publishedAt: DateTime!
    $updatedAt: DateTime!
  ) {
    publishArticle(id: $id, version: $version, publishedAt: $publishedAt, updatedAt: $updatedAt) {
      ...ArticleMutationFragment
    }
  }

  ${ArticleMutationFragment}
`

export interface PublishArticleMutationData {
  publishArticle: ArticleMutationData
}

export interface PublishArticleVariables {
  id: string
  version: number
  publishedAt: string
  updatedAt: string
}

export function usePublishArticleMutation(
  opts?: MutationHookOptions<PublishArticleMutationData, PublishArticleVariables>
) {
  return useMutation<PublishArticleMutationData, PublishArticleVariables>(
    PublishArticleMutation,
    opts
  )
}

const UnpublishArticleMutation = gql`
  mutation PublishArticle($id: ID!) {
    unpublishArticle(id: $id) {
      ...ArticleMutationFragment
    }
  }

  ${ArticleMutationFragment}
`

export interface UnpublishArticleMutationData {
  unpublishArticle: ArticleMutationData
}

export interface UnpublishArticleVariables {
  id: string
}

export function useUnpublishArticleMutation(
  opts?: MutationHookOptions<UnpublishArticleMutationData, UnpublishArticleVariables>
) {
  return useMutation<UnpublishArticleMutationData, UnpublishArticleVariables>(
    UnpublishArticleMutation,
    opts
  )
}

const DeleteArticleMutation = gql`
  mutation DeleteArticle($id: ID!) {
    deleteArticle(id: $id)
  }
`

export interface DeleteArticleMutationData {
  deleteArticle?: boolean
}

export interface DeleteArticleVariables {
  id: string
}

export function useDeleteArticleMutation(
  opts?: MutationHookOptions<DeleteArticleMutationData, DeleteArticleVariables>
) {
  return useMutation<DeleteArticleMutationData, DeleteArticleVariables>(DeleteArticleMutation, opts)
}

const GetArticleQuery = gql`
  query GetArticle($id: ID!) {
    article(id: $id) {
      id
      publishedAt
      latest {
        id
        version
        slug
        preTitle
        title
        lead
        image {
          ...ImageRefFragment
        }
        tags
        authors {
          ...AuthorFragment
        }
        breaking
        shared
        blocks {
          __typename

          ... on TitleBlock {
            title
            lead
          }

          ... on RichTextBlock {
            richText
          }

          ... on QuoteBlock {
            quote
            author
          }

          ... on LinkPageBreakBlock {
            text
            linkText
            linkURL
          }

          ... on ImageBlock {
            caption
            image {
              ...ImageRefFragment
            }
          }

          ... on FacebookPostBlock {
            userID
            postID
          }

          ... on InstagramPostBlock {
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

          ... on EmbedBlock {
            url
            title
            width
            height
          }
        }
      }
    }
  }

  ${ImageRefFragment}
  ${AuthorFragment}
`

export interface GetArticleData {
  article?: any // TODO: Type query
}

export interface GetArticleVariables {
  id: string
}

export function useGetArticleQuery(opts: QueryHookOptions<GetArticleData, GetArticleVariables>) {
  return useQuery<GetArticleData, GetArticleVariables>(GetArticleQuery, opts)
}
