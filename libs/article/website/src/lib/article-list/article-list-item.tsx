import {Article} from '@wepublish/website/api'
import {Theme, styled, css, useTheme} from '@mui/material'
import {useWebsiteBuilder} from '@wepublish/website/builder'
import {isImageBlock} from '@wepublish/block-content/website'

export const ArticleListItemImageWrapper = styled('div')`
  display: grid;
  width: 100%;
`

export const ArticleListItemContent = styled('div')``

export const ArticleListItemAuthors = styled('div')`
  margin-top: ${({theme}) => theme.spacing(2)};
`

export const wrapperStyles = (theme: Theme) => css`
  display: grid;
  gap: ${theme.spacing(2)};
  text-align: left;
  text-decoration: none;
  color: inherit;
  align-items: stretch;
  align-content: flex-start;
`

const imageStyles = css`
  min-height: inherit;
  object-fit: cover;
`

export function ArticleListItem({
  className,
  title,
  preTitle,
  authors,
  image: seoImage,
  blocks,
  publishedAt,
  url
}: Article & {className?: string}) {
  const theme = useTheme()
  const {
    elements: {Image, H5, Link},
    date: {format}
  } = useWebsiteBuilder()

  const imageBlock = blocks.find(isImageBlock)
  const image = seoImage ?? imageBlock?.image

  return (
    <Link css={wrapperStyles(theme)} className={className} href={url}>
      <ArticleListItemImageWrapper>
        {image && <Image image={image} square css={imageStyles} />}
      </ArticleListItemImageWrapper>

      <ArticleListItemContent>
        <time dateTime={publishedAt}>{format(new Date(publishedAt), false)}</time>

        {title && (
          <H5 component="h1">
            {preTitle && `${preTitle}: `}
            {title}
          </H5>
        )}

        {!!authors.length && (
          <ArticleListItemAuthors>{authors.map(a => a.name).join(', ')}</ArticleListItemAuthors>
        )}
      </ArticleListItemContent>
    </Link>
  )
}
