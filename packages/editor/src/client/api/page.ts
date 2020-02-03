import gql from 'graphql-tag'

import {useMutation, useQuery, QueryHookOptions, MutationHookOptions} from '@apollo/react-hooks'

import {VersionState} from './common'
import {ArticleRefFragment} from './article'
import {ImageRefData, ImageRefFragment} from './image'

export const PageMutationFragment = gql`
  fragment PageMutationFragment on Page {
    id
    publishedAt
    latest {
      version
    }
  }
`

export interface PageMutationData {
  id: string
  publishedAt?: string
  latest: {
    version: number
  }
}

export const PageRefFragment = gql`
  fragment PageRefFragment on Page {
    id
    createdAt
    publishedAt

    latest {
      updatedAt

      state
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
  publishedAt: string

  latest: {
    updatedAt: string
    state: VersionState
    title?: string
    description?: string
    image?: ImageRefData
  }
}

// Query
// =====

const ListPagesQuery = gql`
  query ListPages($filter: String) {
    pages(filter: $filter) {
      nodes {
        ...PageRefFragment
      }
    }
  }

  ${PageRefFragment}
`

export interface ListPagesData {
  pages: {
    nodes: PageReference[]
  }
}

export interface ListPagesVariables {
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
  mutation PublishPage($id: ID!, $version: Int!, $publishedAt: DateTime!, $updatedAt: DateTime!) {
    publishPage(id: $id, version: $version, publishedAt: $publishedAt, updatedAt: $updatedAt) {
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
  version: number
  publishedAt: string
  updatedAt: string
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
      publishedAt
      latest {
        id
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

          ... on ImageBlock {
            caption
            image {
              ...ImageRefFragment
            }
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

          ... on LinkPageBreakBlock {
            text
            linkText
            linkURL
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
