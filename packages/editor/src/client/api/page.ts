import gql from 'graphql-tag'

import {useMutation, useQuery, QueryHookOptions} from '@apollo/react-hooks'

import {VersionState} from './common'
import {ArticleRefFragment} from './article'
import {ImageRefData} from './image'

export interface PageReference {
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

const ListPagesQuery = gql`
  query ListPages {
    pages {
      nodes {
        id
        createdAt
        updatedAt

        latest {
          state
          title
        }
      }
    }
  }
`

export interface ListPagesData {
  pages: {
    nodes: PageReference[]
  }
}

export interface ListPagesVariables {}

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

export interface PageMutationData {
  id: string
}

const CreatePageMutation = gql`
  mutation CreatePage($input: PageInput!) {
    createPage(input: $input) {
      id
    }
  }
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
  mutation UpdatePage($id: ID!, $state: VersionState!, $input: PageInput!) {
    updatePage(id: $id, state: $state, input: $input) {
      id
    }
  }
`

export interface UpdatePageMutationData {
  updatePage: PageMutationData
}

export interface UpdatePageVariables {
  id: string
  state: VersionState
  input: PageInput
}

export function useUpdatePageMutation() {
  return useMutation<UpdatePageMutationData, UpdatePageVariables>(UpdatePageMutation)
}

const GetPageQuery = gql`
  query GetPage($id: ID!) {
    page(id: $id) {
      id
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
