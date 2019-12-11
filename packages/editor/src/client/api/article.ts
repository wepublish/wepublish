import gql from 'graphql-tag'
import {Node} from 'slate'

import {useMutation, useQuery, QueryHookOptions} from '@apollo/react-hooks'

import {BlockType, VersionState} from './common'
import {ImageRefFragment, ImageRefData} from './image'

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
  readonly id: string

  readonly createdAt: string
  readonly updatedAt?: string

  readonly latest: {
    readonly state: VersionState
    readonly title?: string
    readonly image?: ImageRefData
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
  readonly articles: {
    readonly nodes: ArticleReference[]
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

export interface ArticleBlockUnionMap {
  readonly [BlockType.Image]?: {caption?: string; imageID?: string}
  readonly [BlockType.Title]?: {title?: string; lead?: string}
  readonly [BlockType.RichText]?: {richText: Node[]}
  readonly [BlockType.Quote]?: {quote?: string; author?: string}

  readonly [BlockType.FacebookPost]?: {userID: string; postID: string}
  readonly [BlockType.InstagramPost]?: {postID: string}
  readonly [BlockType.TwitterTweet]?: {userID: string; tweetID: string}
  readonly [BlockType.VimeoVideo]?: {videoID: string}
  readonly [BlockType.YouTubeVideo]?: {videoID: string}
  readonly [BlockType.SoundCloudTrack]?: {trackID: string}

  readonly [BlockType.Embed]?: {url?: string; title?: string; width?: number; height?: number}
}

export interface ArticleInput {
  readonly slug: string
  readonly preTitle?: string
  readonly title: string
  readonly lead: string
  readonly tags: string[]
  readonly imageID?: string
  readonly authorIDs: string[]
  readonly shared: boolean
  readonly breaking: boolean
  readonly blocks: any[]
}

export interface ArticleMutationData {
  readonly id: string
}

const CreateArticleMutation = gql`
  mutation CreateArticle($input: ArticleInput!) {
    createArticle(input: $input) {
      id
    }
  }
`

export interface CreateArticleMutationData {
  readonly createArticle: ArticleMutationData
}

export interface CreateArticleVariables {
  readonly input: ArticleInput
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
  readonly updateArticle: ArticleMutationData
}

export interface UpdateArticleVariables {
  readonly id: string
  readonly state: VersionState
  readonly input: ArticleInput
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
          id
          name
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
`

export interface GetArticleData {
  readonly article?: any // TODO: Type query
}

export interface GetArticleVariables {
  readonly id: string
}

export function useGetArticleQuery(opts: QueryHookOptions<GetArticleData, GetArticleVariables>) {
  return useQuery<GetArticleData, GetArticleVariables>(GetArticleQuery, opts)
}
