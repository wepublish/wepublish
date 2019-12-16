import gql from 'graphql-tag'
import {useMutation, useQuery, QueryHookOptions} from '@apollo/react-hooks'

import {VersionState} from './common'
import {ImageRefFragment, ImageRefData} from './image'
import {AuthorFragment} from './author'

export const ArticleRefFragment = gql`
  fragment ArticleRefFragment on Article {
    id
    createdAt
    updatedAt

    latest {
      state
      title
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
  updatedAt: string

  latest: {
    state: VersionState
    title?: string
    image?: ImageRefData
  }
}

// Query
// =====

const ListArticlesQuery = gql`
  query ListArticles {
    articles {
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

export interface ListArticlesVariables {}

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

export interface ArticleMutationData {
  id: string
}

const CreateArticleMutation = gql`
  mutation CreateArticle($input: ArticleInput!) {
    createArticle(input: $input) {
      id
    }
  }
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
  mutation UpdateArticle($id: ID!, $state: VersionState!, $input: ArticleInput!) {
    updateArticle(id: $id, state: $state, input: $input) {
      id
    }
  }
`

export interface UpdateArticleMutationData {
  updateArticle: ArticleMutationData
}

export interface UpdateArticleVariables {
  id: string
  state: VersionState
  input: ArticleInput
}

export function useUpdateArticleMutation() {
  return useMutation<UpdateArticleMutationData, UpdateArticleVariables>(UpdateArticleMutation)
}

const GetArticleQuery = gql`
  query GetArticle($id: ID!) {
    article(id: $id) {
      id
      latest {
        id
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
