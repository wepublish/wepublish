import {Author} from '@wepublish/website/api'
import {Theme, styled, css, useTheme} from '@mui/material'
import {useWebsiteBuilder} from '@wepublish/website/builder'

export const AuthorListItemImageWrapper = styled('div')`
  width: 240px;
  height: 240px;
`

export const AuthorListItemContent = styled('div')``

const wrapperStyles = (theme: Theme) => css`
  display: grid;
  gap: ${theme.spacing(3)};
  width: 240px;
  align-content: flex-start;
  text-align: center;
  text-decoration: none;
  color: inherit;
`

const imageStyles = css`
  border-radius: 50%;
`

export function AuthorListItem({
  className,
  slug,
  image,
  name,
  jobTitle
}: Author & {className?: string}) {
  const theme = useTheme()
  const {
    elements: {Image, Paragraph, H6, Link}
  } = useWebsiteBuilder()

  return (
    <Link css={wrapperStyles(theme)} className={className} href={slug}>
      <AuthorListItemImageWrapper>
        {image && <Image image={image} square css={imageStyles} />}
      </AuthorListItemImageWrapper>

      <AuthorListItemContent>
        <H6>{name}</H6>

        {jobTitle && <Paragraph gutterBottom={false}>{jobTitle}</Paragraph>}
      </AuthorListItemContent>
    </Link>
  )
}
