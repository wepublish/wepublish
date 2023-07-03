import {QueryResult} from '@apollo/client'
import {
  AuthorQuery,
  AuthorListQuery,
  FullAuthorFragment,
  AuthorListQueryVariables
} from '@wepublish/website/api'
import {ComponentType} from 'react'

export type BuilderAuthorProps = Pick<QueryResult<AuthorQuery>, 'data' | 'loading' | 'error'> & {
  className?: string
  authorLinks?: ComponentType<BuilderAuthorLinksProps>
}

export type BuilderAuthorChipProps = {
  author: FullAuthorFragment
  className?: string
}

export type BuilderAuthorListItemProps = {
  author: FullAuthorFragment
  className?: string
}

export type BuilderAuthorListProps = Pick<
  QueryResult<AuthorListQuery>,
  'data' | 'loading' | 'error'
> & {
  className?: string
  authors?: ComponentType<BuilderAuthorChipProps>
  variables?: Partial<AuthorListQueryVariables>
  onVariablesChange?: (variables: Partial<AuthorListQueryVariables>) => void
}

export type BuilderAuthorLinksProps = {
  links: Exclude<Exclude<AuthorQuery['author'], null | undefined>['links'], null | undefined>
}
