import {FullAuthorFragment} from '@wepublish/website/api'
import {Theme, styled, css, useTheme} from '@mui/material'
import {useWebsiteBuilder} from '@wepublish/website/builder'

export const AuthorListItemImageWrapper = styled('div')`
  width: 240px;
  height: 240px;
`

const wrapperStyles = (theme: Theme) => css`
  display: grid;
  gap: ${theme.spacing(3)};
  grid-template-rows: 240px 1fr;
  width: 240px;
  align-items: flex-start;
  text-align: center;
  text-decoration: none;
  color: inherit;
`

const imageStyles = css`
  border-radius: 50%;
`

type AuthorListItemProps = {
  className?: string
  author: FullAuthorFragment
}

export function AuthorListItem({className, author}: AuthorListItemProps) {
  const theme = useTheme()
  const {
    elements: {Image, Paragraph, H6, Link}
  } = useWebsiteBuilder()

  return (
    <Link css={wrapperStyles(theme)} className={className} href={author.slug}>
      <AuthorListItemImageWrapper>
        {author.image && <Image image={author.image} square css={imageStyles} />}
      </AuthorListItemImageWrapper>

      <div>
        <H6>{author.name}</H6>

        {author.jobTitle && <Paragraph gutterBottom={false}>{author.jobTitle}</Paragraph>}
      </div>
    </Link>
  )
}
