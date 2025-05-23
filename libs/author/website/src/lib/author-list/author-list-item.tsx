import {Author} from '@wepublish/website/api'
import {Theme, css, useTheme} from '@mui/material'
import styled from '@emotion/styled'
import {useWebsiteBuilder} from '@wepublish/website/builder'

export const AuthorListItemImageWrapper = styled('div')`
  display: grid;
  width: 100%;
`

export const AuthorListItemContent = styled('div')``

const wrapperStyles = (theme: Theme) => css`
  display: grid;
  grid-template-rows: max-content 1fr;
  gap: ${theme.spacing(3)};
  width: 240px;
  text-align: center;
  text-decoration: none;
  color: inherit;
`

const imageStyles = css`
  border-radius: 50%;
`

export function AuthorListItem({
  className,
  url,
  image,
  name,
  jobTitle
}: Author & {className?: string}) {
  const theme = useTheme()
  const {
    elements: {Image, Paragraph, H6, Link}
  } = useWebsiteBuilder()

  return (
    <Link css={wrapperStyles(theme)} className={className} href={url}>
      <AuthorListItemImageWrapper>
        {image && <Image image={image} square css={imageStyles} maxWidth={500} />}
      </AuthorListItemImageWrapper>

      <AuthorListItemContent>
        <H6>{name}</H6>

        {jobTitle && <Paragraph gutterBottom={false}>{jobTitle}</Paragraph>}
      </AuthorListItemContent>
    </Link>
  )
}
