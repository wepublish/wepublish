import gql from 'graphql-tag'
import {useMutation, useQuery, QueryHookOptions} from '@apollo/react-hooks'

const CreateArticleMutation = gql`
  mutation($input: ArticleInput!) {
    createArticle(input: $input) {
      id
    }
  }
`

export interface ArticleMutationData {
  readonly id: string
}

export interface ArticleCreateMutationData {
  readonly createArticle: ArticleMutationData
}

export interface ArticleBlockUnionMap {}

export interface ArticleCreateVariables {
  readonly input: ArticleInput
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

export function useArticleCreateMutation() {
  return useMutation<ArticleCreateMutationData, ArticleCreateVariables>(CreateArticleMutation)
}

const GetArticleQuery = gql`
  query($id: ID!) {
    article(id: $id) {
      id
    }
  }
`

export interface ArticleData {}

export interface GetArticleData {
  readonly article?: ArticleData
}

export interface GetArticleVariables {
  readonly id: string
}

export function useGetArticleQuery(opts: QueryHookOptions<GetArticleData, GetArticleVariables>) {
  return useQuery<GetArticleData, GetArticleVariables>(GetArticleQuery, opts)
}
