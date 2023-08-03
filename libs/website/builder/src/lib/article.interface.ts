import {QueryResult} from '@apollo/client'
import {
  Article,
  ArticleQuery,
  ArticleListQuery,
  ArticleListQueryVariables
} from '@wepublish/website/api'

export type BuilderArticleProps = Pick<QueryResult<ArticleQuery>, 'data' | 'loading' | 'error'> & {
  className?: string
}

export type BuilderArticleSEOProps = {
  article: Article
}

export type BuilderArticleListItemProps = Article & {
  className?: string
}

export type BuilderArticleListProps = Pick<
  QueryResult<ArticleListQuery>,
  'data' | 'loading' | 'error'
> & {
  className?: string
  variables?: Partial<ArticleListQueryVariables>
  onVariablesChange?: (variables: Partial<ArticleListQueryVariables>) => void
}
