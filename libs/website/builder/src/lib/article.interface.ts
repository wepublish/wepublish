import {QueryResult} from '@apollo/client'
import {Article, ArticleQuery} from '@wepublish/website/api'

export type BuilderArticleProps = Pick<QueryResult<ArticleQuery>, 'data' | 'loading' | 'error'> & {
  className?: string
}

export type BuilderArticleSEOProps = {
  article: Article
}
