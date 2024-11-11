import {QueryResult} from '@apollo/client'
import {
  Article,
  ArticleQuery,
  ArticleListQuery,
  ArticleListQueryVariables
} from '@wepublish/website/api'
import {PropsWithChildren} from 'react'

export type BuilderArticleProps = PropsWithChildren<
  Pick<QueryResult<ArticleQuery>, 'data' | 'loading' | 'error'> & {
    className?: string
  }
>

export type BuilderArticleSEOProps = {
  article: Article
}

export type BuilderArticleListProps = Pick<
  QueryResult<ArticleListQuery>,
  'data' | 'loading' | 'error'
> & {
  className?: string
  variables?: Partial<ArticleListQueryVariables>
  onVariablesChange?: (variables: Partial<ArticleListQueryVariables>) => void
}

export type BuilderArticleDateProps = {
  article: Article
  className?: string
}
