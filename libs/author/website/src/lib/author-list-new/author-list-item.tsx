import {FullAuthorFragment} from '@wepublish/website/api'
import {styled, css} from '@mui/material'
import {useWebsiteBuilder} from '@wepublish/website/builder'

export const AuthorListItemWrapper = styled('a')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  grid-template-rows: 240px 1fr;
  width: 240px;
  align-items: flex-start;
  text-align: center;
  text-decoration: none;
  color: inherit;
`

export const AuthorListItemImageWrapper = styled('div')`
  width: 240px;
  height: 240px;
`

const imageStyles = css`
  border-radius: 50%;
`

type AuthorListItemProps = {
  className?: string
  author: FullAuthorFragment
}

export function AuthorListItem({className, author}: AuthorListItemProps) {
  const {
    elements: {Image, Paragraph, H6}
  } = useWebsiteBuilder()

  return (
    <AuthorListItemWrapper className={className} href={author.slug}>
      <AuthorListItemImageWrapper>
        {author.image && <Image image={author.image} square css={imageStyles} />}
      </AuthorListItemImageWrapper>

      <div>
        <H6>{author.name}</H6>

        {author.jobTitle && <Paragraph gutterBottom={false}>{author.jobTitle}</Paragraph>}
      </div>
    </AuthorListItemWrapper>
  )
}
