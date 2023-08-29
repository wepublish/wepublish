import {Article} from '@wepublish/website/api'
import {Theme, styled, css, useTheme} from '@mui/material'
import {useWebsiteBuilder} from '@wepublish/website/builder'

export const ArticleListItemImageWrapper = styled('div')`
  display: grid;
  width: 100%;
`

export const ArticleListItemContent = styled('div')``

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

export function ArticleListItem({className, ...data}: Article & {className?: string}) {
  const theme = useTheme()
  const {
    elements: {Image, Paragraph, H5, Link},
    date: {format}
  } = useWebsiteBuilder()

  return (
    <Link css={wrapperStyles(theme)} className={className} href={data.url}>
      <ArticleListItemImageWrapper>
        {data.image && <Image image={data.image} square css={imageStyles} />}
      </ArticleListItemImageWrapper>

      <ArticleListItemContent>
        <time dateTime={data.publishedAt}>{format(new Date(data.publishedAt), false)}</time>

        {data.title && <H5 component="h1">{data.title}</H5>}
        {data.authors && <Paragraph>von {data.authors.map(a => a.name).join(', ')}</Paragraph>}
      </ArticleListItemContent>
    </Link>
  )
}
