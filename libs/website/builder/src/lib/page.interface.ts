import {QueryResult} from '@apollo/client'
import {Page, PageQuery} from '@wepublish/website/api'

export type BuilderPageProps = Pick<QueryResult<PageQuery>, 'data' | 'loading' | 'error'> & {
  className?: string
}

export type BuilderPageSEOProps = {
  page: Page
}
