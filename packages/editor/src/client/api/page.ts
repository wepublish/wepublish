import gql from 'graphql-tag'

import {useMutation, useQuery, QueryHookOptions, MutationHookOptions} from '@apollo/react-hooks'

import {PageInfo} from './common'
import {ArticleRefFragment} from './article'
import {ImageRefData, ImageRefFragment} from './image'

export const PageMutationFragment = gql`
  fragment PageMutationFragment on Page {
    id

    published {
      publishedAt
      revision
    }

    latest {
      revision
    }
  }
`

export interface PageMutationData {
  id: string

  published?: {
    publishedAt: string
    revision: number
  }

  latest: {
    revision: number
  }
}

export const PageRefFragment = gql`
  fragment PageRefFragment on Page {
    id
    createdAt
    modifiedAt

    draft {
      revision
    }

    pending {
      revision
    }

    published {
      publishedAt
      updatedAt
      revision
    }

    latest {
      revision
      title
      description
      image {
        ...ImageRefFragment
      }
    }
  }

  ${ImageRefFragment}
`

export interface PageReference {
  id: string

  createdAt: string
  modifiedAt: string

  draft?: {revision: number}
  pending?: {revision: number}
  published?: {revision: number}

  latest: {
    publishedAt?: string
    updatedAt?: string
    title?: string
    description?: string
    image?: ImageRefData
  }
}

// Query
// =====

const ListPagesQuery = gql`
  query ListPages($filter: String, $after: ID, $first: Int) {
    pages(first: $first, after: $after, filter: {title: $filter}) {
      nodes {
        ...PageRefFragment
      }

      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }

      totalCount
    }
  }

  ${PageRefFragment}
`

export interface ListPagesData {
  pages: {
    nodes: PageReference[]
    pageInfo: PageInfo
    totalCount: number
  }
}

export interface ListPagesVariables {
  first: number
  after?: string
  filter?: string
}

export function useListPagesQuery(opts?: QueryHookOptions<ListPagesData, ListPagesVariables>) {
  return useQuery<ListPagesData, ListPagesVariables>(ListPagesQuery, opts)
}

// Mutation
// ========

export interface PageBlockUnionMap {
  articleTeaserGrid?: {
    teasers: Array<{type: string; articleID: string} | null>
    numColumns: number
  }
}

export interface PageInput {
  slug: string
  title: string
  description: string
  tags: string[]
  imageID?: string
  blocks: any[]
}

const CreatePageMutation = gql`
  mutation CreatePage($input: PageInput!) {
    createPage(input: $input) {
      ...PageMutationFragment
    }
  }

  ${PageMutationFragment}
`

export interface CreatePageMutationData {
  createPage: PageMutationData
}

export interface CreatePageVariables {
  input: PageInput
}

export function useCreatePageMutation() {
  return useMutation<CreatePageMutationData, CreatePageVariables>(CreatePageMutation)
}

const UpdatePageMutation = gql`
  mutation UpdatePage($id: ID!, $input: PageInput!) {
    updatePage(id: $id, input: $input) {
      ...PageMutationFragment
    }
  }

  ${PageMutationFragment}
`

export interface UpdatePageMutationData {
  updatePage: PageMutationData
}

export interface UpdatePageVariables {
  id: string
  input: PageInput
}

export function useUpdatePageMutation() {
  return useMutation<UpdatePageMutationData, UpdatePageVariables>(UpdatePageMutation)
}

const PublishPageMutation = gql`
  mutation PublishPage(
    $id: ID!
    $publishAt: DateTime
    $publishedAt: DateTime
    $updatedAt: DateTime
  ) {
    publishPage(id: $id, publishAt: $publishAt, publishedAt: $publishedAt, updatedAt: $updatedAt) {
      ...PageMutationFragment
    }
  }

  ${PageMutationFragment}
`

export interface PublishPageMutationData {
  publishPage: PageMutationData
}

export interface PublishPageVariables {
  id: string
  publishAt?: string
  publishedAt?: string
  updatedAt?: string
}

export function usePublishPageMutation(
  opts?: MutationHookOptions<PublishPageMutationData, PublishPageVariables>
) {
  return useMutation<PublishPageMutationData, PublishPageVariables>(PublishPageMutation, opts)
}

const UnpublishPageMutation = gql`
  mutation PublishPage($id: ID!) {
    unpublishPage(id: $id) {
      ...PageMutationFragment
    }
  }

  ${PageMutationFragment}
`

export interface UnpublishPageMutationData {
  unpublishPage: PageMutationData
}

export interface UnpublishPageVariables {
  id: string
}

export function useUnpublishPageMutation(
  opts?: MutationHookOptions<UnpublishPageMutationData, UnpublishPageVariables>
) {
  return useMutation<UnpublishPageMutationData, UnpublishPageVariables>(UnpublishPageMutation, opts)
}

const DeletePageMutation = gql`
  mutation DeletePage($id: ID!) {
    deletePage(id: $id)
  }
`

export interface DeletePageMutationData {
  deletePage?: boolean
}

export interface DeletePageVariables {
  id: string
}

export function useDeletePageMutation(
  opts?: MutationHookOptions<DeletePageMutationData, DeletePageVariables>
) {
  return useMutation<DeletePageMutationData, DeletePageVariables>(DeletePageMutation, opts)
}

const GetPageQuery = gql`
  query GetPage($id: ID!) {
    page(id: $id) {
      id

      published {
        publishedAt
        updatedAt
      }

      latest {
        publishedAt
        updatedAt
        slug
        title
        description
        image {
          ...ImageRefFragment
        }
        tags
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

          ... on ArticleTeaserGridBlock {
            teasers {
              type
              article {
                ...ArticleRefFragment
              }
            }
            numColumns
          }
        }
      }
    }
  }

  ${ArticleRefFragment}
`

export interface GetPageData {
  page?: any // TODO: Type query
}

export interface GetPageVariables {
  id: string
}

export function useGetPageQuery(opts: QueryHookOptions<GetPageData, GetPageVariables>) {
  return useQuery<GetPageData, GetPageVariables>(GetPageQuery, opts)
}
