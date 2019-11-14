import gql from 'graphql-tag'

import {useMutation, useQuery, QueryHookOptions} from '@apollo/react-hooks'
import {ImageTransformation, VersionState} from './types'

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
  readonly pages: any
}

export interface ListPagesVariables {
  readonly input: PageInput
}

export function useListPagesQuery(opts?: QueryHookOptions<ListPagesData, ListPagesVariables>) {
  return useQuery<ListPagesData, ListPagesVariables>(ListPagesQuery, opts)
}

// Mutation
// ========

export interface PageBlockUnionMap {
  readonly articleTeaserGrid?: {
    teasers: Array<{type: string; articleID: string} | null>
    numColumns: number
  }
}

export interface PageInput {
  readonly slug: string
  readonly title: string
  readonly description: string
  readonly tags: string[]
  readonly imageID?: string
  readonly blocks: any[]
}

export interface PageMutationData {
  readonly id: string
}

const CreatePageMutation = gql`
  mutation CreatePage($input: PageInput!) {
    createPage(input: $input) {
      id
    }
  }
`

export interface CreatePageMutationData {
  readonly createPage: PageMutationData
}

export interface CreatePageVariables {
  readonly input: PageInput
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
  readonly updatePage: PageMutationData
}

export interface UpdatePageVariables {
  readonly id: string
  readonly state: VersionState
  readonly input: PageInput
}

export function useUpdatePageMutation() {
  return useMutation<UpdatePageMutationData, UpdatePageVariables>(UpdatePageMutation)
}

const GetPageQuery = gql`
  query GetPage(
    $id: ID!
    $metaImageTransformation: ImageTransformation!
    $blockImageTransformation: ImageTransformation!
  ) {
    page(id: $id) {
      id
      latest {
        id
        slug
        title
        description
        image {
          id
          width
          height
          transform(transformations: [$metaImageTransformation])
        }
        tags
        blocks {
          __typename

          ... on BaseBlock {
            key
          }

          ... on ArticleTeaserGridBlock {
            teasers {
              type
              article {
                id
                latest {
                  title
                  image {
                    id
                    width
                    height
                    transform(transformations: [$blockImageTransformation])
                  }
                }
              }
            }
            numColumns
          }
        }
      }
    }
  }
`

export interface GetPageData {
  readonly page?: any // TODO: Type query
}

export interface GetPageVariables {
  readonly id: string
  readonly metaImageTransformation: ImageTransformation
  readonly blockImageTransformation: ImageTransformation
}

export function useGetPageQuery(opts: QueryHookOptions<GetPageData, GetPageVariables>) {
  return useQuery<GetPageData, GetPageVariables>(GetPageQuery, opts)
}
