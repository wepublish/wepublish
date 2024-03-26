import {css, styled} from '@mui/material'
import {BuilderAuthorChipProps, useWebsiteBuilder} from '@wepublish/website/builder'

export const AuthorChipWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};
`

export const AuthorChipDivider = styled('hr')`
  width: 100%;
  height: 1px;
  background-color: ${({theme}) => theme.palette.divider};
  margin: 0;
`

export const AuthorChipAuthorWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};
  grid-template-columns: 40px 1fr;
  align-items: end;
`

export const AuthorChipMetaWrapper = styled('div')`
  display: grid;
  grid-template-columns: max-content max-content;
  justify-content: space-between;
  align-items: center;
`

export const AuthorChipImageWrapper = styled('div')`
  display: grid;
`

export const AuthorChipContentWrapper = styled('div')`
  display: grid;
`

export const AuthorChipJobTitle = styled('div')``

export const AuthorChipName = styled('div')`
  font-weight: 500;
`

const imageStyles = css`
  border-radius: 50%;
`

export function AuthorChip({className, author, publishedAt}: BuilderAuthorChipProps) {
  const {
    AuthorLinks,
    elements: {Image, Link},
    date
  } = useWebsiteBuilder()

  return (
    <AuthorChipWrapper className={className}>
      <AuthorChipAuthorWrapper>
        <AuthorChipImageWrapper>
          {author.image && <Image image={author.image} square css={imageStyles} />}
        </AuthorChipImageWrapper>

        <AuthorChipContentWrapper>
          <AuthorChipName>
            Von <Link href={author.url}>{author.name}</Link>
          </AuthorChipName>

          {author.jobTitle && <AuthorChipJobTitle>{author.jobTitle}</AuthorChipJobTitle>}
        </AuthorChipContentWrapper>
      </AuthorChipAuthorWrapper>

      <AuthorChipDivider />

      <AuthorChipMetaWrapper>
        {publishedAt && (
          <time dateTime={publishedAt}>{date.format(new Date(publishedAt), false)}</time>
        )}

        {!!author.links?.length && <AuthorLinks links={author.links} />}
      </AuthorChipMetaWrapper>
    </AuthorChipWrapper>
  )
}
