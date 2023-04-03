import {QueryResult} from '@apollo/client'
import {ArticleQuery} from '@wepublish/website/api'

export type BuilderArticleProps = Pick<QueryResult<ArticleQuery>, 'data' | 'loading' | 'error'> & {
  className?: string
}
