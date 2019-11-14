import gql from 'graphql-tag'

import {DocumentJSON} from 'slate'
import {useMutation, useQuery, QueryHookOptions} from '@apollo/react-hooks'
import {ImageTransformation} from './types'

export enum BlockType {
  RichText = 'richText',
  Title = 'title',
  Image = 'image'
}

// Query
// =====

const ListArticlesQuery = gql`
  query ListArticles {
    articles {
      nodes {
        id
        createdAt
        updatedAt

        draft {
          version
        }

        latest {
          version
          title
        }
      }
    }
  }
`

export interface ListArticlesData {
  readonly articles: any
}

export interface ListArticlesVariables {
  readonly input: ArticleInput
}

export function useListArticlesQuery(
  opts?: QueryHookOptions<ListArticlesData, ListArticlesVariables>
) {
  return useQuery<ListArticlesData, ListArticlesVariables>(ListArticlesQuery, opts)
}

// Mutation
// ========

export interface ArticleBlockUnionMap {
  readonly [BlockType.Image]?: {caption?: string; imageID?: string}
  readonly [BlockType.Title]?: {title: string; lead?: string}
  readonly [BlockType.RichText]?: {richText: DocumentJSON}
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
  mutation UpdateArticle($id: ID!, $input: ArticleInput!) {
    updateArticle(id: $id, input: $input) {
      id
    }
  }
`

export interface UpdateArticleMutationData {
  readonly updateArticle: ArticleMutationData
}

export interface UpdateArticleVariables {
  readonly id: string
  readonly input: ArticleInput
}

export function useUpdateArticleMutation() {
  return useMutation<UpdateArticleMutationData, UpdateArticleVariables>(UpdateArticleMutation)
}

const PublishArticleMutation = gql`
  mutation PublishArticle($id: ID!) {
    publishArticle(id: $id) {
      id
    }
  }
`

export interface PublishArticleMutationData {
  readonly publishArticle: ArticleMutationData
}

export interface PublishArticleVariables {
  readonly id: string
}

export function usePublishArticleMutation() {
  return useMutation<PublishArticleMutationData, PublishArticleVariables>(PublishArticleMutation)
}

const GetArticleQuery = gql`
  query GetArticle(
    $id: ID!
    $metaImageTransformation: ImageTransformation!
    $blockImageTransformation: ImageTransformation!
  ) {
    article(id: $id) {
      id
      latest {
        id
        slug
        preTitle
        title
        lead
        image {
          id
          width
          height
          transform(transformations: [$metaImageTransformation])
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

          ... on BaseBlock {
            key
          }

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
              id
              transform(transformations: [$blockImageTransformation])
            }
          }
        }
      }
    }
  }
`

export interface BaseBlock {
  readonly __typename: BlockType
  readonly key: string
}

export interface TitleBlock {}

export interface GetArticleData {
  readonly article?: any // TODO: Type query
}

export interface GetArticleVariables {
  readonly id: string
  readonly metaImageTransformation: ImageTransformation
  readonly blockImageTransformation: ImageTransformation
}

export function useGetArticleQuery(opts: QueryHookOptions<GetArticleData, GetArticleVariables>) {
  return useQuery<GetArticleData, GetArticleVariables>(GetArticleQuery, opts)
}
