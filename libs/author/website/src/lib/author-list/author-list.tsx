import {useAuthorListQuery, AuthorListQuery, AuthorSort, SortOrder} from '@wepublish/website/api'
import {styled} from '@mui/material'
import {QueryResult} from '@apollo/client'
import {useEffect} from 'react'
import {BuilderAuthorListProps, useWebsiteBuilder} from '@wepublish/website/builder'

type IdOrSlug = {id: string; slug?: never} | {id?: never; slug: string}

export const AuthorListWrapper = styled('article')`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: ${({theme}) => theme.spacing(4)};
  justify-items: center;
`

export type AuthorListProps = IdOrSlug &
  Pick<BuilderAuthorListProps, 'authors'> & {
    onQuery?: (
      queryResult: Pick<QueryResult<AuthorListQuery>, 'data' | 'loading' | 'error' | 'refetch'>
    ) => void
  } & BuilderAuthorListProps

export function AuthorList({onQuery, className}: AuthorListProps) {
  const {AuthorChip} = useWebsiteBuilder()

  const authorListQueryVariables = {
    // should the AuthorList accept variables?
  }

  const {data, loading, error, refetch} = useAuthorListQuery({
    variables: authorListQueryVariables
  })

  useEffect(() => {
    onQuery?.({data, loading, error, refetch})
  }, [data, loading, error, refetch, onQuery])

  console.log('data', data)
  console.log('data?.authors', data?.authors)

  return (
    <AuthorListWrapper className={className}>
      {data?.authors?.nodes.map(author => (
        <AuthorChip key={author.id} author={author} />
      ))}
    </AuthorListWrapper>
  )
}
