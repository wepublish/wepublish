import {css, styled} from '@mui/material'
import {BuilderAuthorChipProps, useWebsiteBuilder} from '@wepublish/website/builder'

export const AuthorChipWrapper = styled('aside')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  grid-template-columns: 65px 1fr;
  align-items: center;
`

export const AuthorChipImageWrapper = styled('div')`
  display: grid;
`

export const AuthorChipContentWrapper = styled('div')`
  display: grid;
`

const imageStyles = css`
  border-radius: 50%;
`

export function AuthorChip({className, author}: BuilderAuthorChipProps) {
  const {
    elements: {Image, Link, Paragraph}
  } = useWebsiteBuilder()

  return (
    <AuthorChipWrapper className={className}>
      <AuthorChipImageWrapper>
        {author.image && <Image image={author.image} square css={imageStyles} />}
      </AuthorChipImageWrapper>

      <AuthorChipContentWrapper>
        <Paragraph gutterBottom={false}>
          <strong>
            Von <Link href={author.url}>{author.name}</Link>
          </strong>
        </Paragraph>

        {author.jobTitle && <Paragraph gutterBottom={false}>{author.jobTitle}</Paragraph>}
      </AuthorChipContentWrapper>
    </AuthorChipWrapper>
  )
}
