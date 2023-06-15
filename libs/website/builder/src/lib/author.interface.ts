import {QueryResult} from '@apollo/client'
import {AuthorQuery} from '@wepublish/website/api'
import {ComponentType} from 'react'

export type BuilderAuthorProps = Pick<QueryResult<AuthorQuery>, 'data' | 'loading' | 'error'> & {
  className?: string
  authorLinks?: ComponentType<BuilderAuthorLinksProps>
}

export type BuilderAuthorLinksProps = {
  links: Exclude<Exclude<AuthorQuery['author'], null | undefined>['links'], null | undefined>
}
