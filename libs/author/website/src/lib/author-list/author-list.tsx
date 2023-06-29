import {useAuthorListQuery, AuthorListQuery, FullAuthorFragment} from '@wepublish/website/api'
import {styled, css} from '@mui/material'
import {QueryResult} from '@apollo/client'
import {useEffect} from 'react'
import {BuilderAuthorListProps, useWebsiteBuilder} from '@wepublish/website/builder'

export const AuthorTileWrapper = styled('a')`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  text-decoration: none;
  color: inherit;
`

export const AuthorTileImageWrapper = styled('div')`
  width: 240px;
  height: 240px;
`

export const AuthorTileContentWrapper = styled('div')`
  margin-top: 20px;
`

export const AuthorListWrapper = styled('article')`
  display: grid;
  grid-template-columns: repeat(4, minmax(230px, 1fr));
  gap: ${({theme}) => theme.spacing(4)};
  justify-items: center;
`

const imageStyles = css`
  border-radius: 50%;
`

export type AuthorListProps = Pick<BuilderAuthorListProps, 'authors'> & {
  onQuery?: (
    queryResult: Pick<QueryResult<AuthorListQuery>, 'data' | 'loading' | 'error' | 'refetch'>
  ) => void
  skip?: number
  take?: number
} & BuilderAuthorListProps

type AuthorTileProps = {
  className?: string
  author: FullAuthorFragment
}

export function AuthorList({onQuery, className, skip, take}: AuthorListProps) {
  const {
    elements: {Image, Paragraph, H6}
  } = useWebsiteBuilder()

  const AuthorTile = ({className, author}: AuthorTileProps) => (
    <AuthorTileWrapper className={className} href={author.slug}>
      <AuthorTileImageWrapper>
        {author.image && <Image image={author.image} square css={imageStyles} />}
      </AuthorTileImageWrapper>

      <AuthorTileContentWrapper>
        <H6>{author.name}</H6>

        {author.jobTitle && <Paragraph gutterBottom={false}>{author.jobTitle}</Paragraph>}
      </AuthorTileContentWrapper>
    </AuthorTileWrapper>
  )

  const authorListQueryVariables = {
    take: take || undefined,
    skip: skip || undefined
  }

  const {data, loading, error, refetch} = useAuthorListQuery({
    variables: authorListQueryVariables
  })

  useEffect(() => {
    onQuery?.({data, loading, error, refetch})
  }, [data, loading, error, refetch, onQuery])

  return (
    <AuthorListWrapper className={className}>
      {data?.authors?.nodes.map(author => (
        <AuthorTile key={author.id} author={author} />
      ))}
    </AuthorListWrapper>
  )
}
