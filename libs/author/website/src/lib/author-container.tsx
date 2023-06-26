import {useAuthorQuery, AuthorQuery} from '@wepublish/website/api'
import {QueryResult} from '@apollo/client'
import {useEffect} from 'react'
import {
  BuilderAuthorProps,
  BuilderContainerProps,
  useWebsiteBuilder
} from '@wepublish/website/builder'

type IdOrSlug = {id: string; slug?: never} | {id?: never; slug: string}

export type AuthorContainerProps = IdOrSlug &
  Pick<BuilderAuthorProps, 'authorLinks'> & {
    onQuery?: (
      queryResult: Pick<QueryResult<AuthorQuery>, 'data' | 'loading' | 'error' | 'refetch'>
    ) => void
  } & BuilderContainerProps

export function AuthorContainer({onQuery, id, slug, authorLinks, className}: AuthorContainerProps) {
  const {Author} = useWebsiteBuilder()
  const {data, loading, error, refetch} = useAuthorQuery({
    variables: {
      id,
      slug
    }
  })

  useEffect(() => {
    onQuery?.({data, loading, error, refetch})
  }, [data, loading, error, refetch, onQuery])

  return (
    <Author
      data={data}
      loading={loading}
      error={error}
      className={className}
      authorLinks={authorLinks}
    />
  )
}
