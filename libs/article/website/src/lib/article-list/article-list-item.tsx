import {Article} from '@wepublish/website/api'
import {format as formatDate} from 'date-fns'
import {Theme, styled, css, useTheme} from '@mui/material'
import {useWebsiteBuilder} from '@wepublish/website/builder'

export const ArticleListItemImageWrapper = styled('div')`
  display: grid;
  width: 100%;
  min-height: 450px;
`

export const ArticleListItemContent = styled('div')``

export const wrapperStyles = (theme: Theme) => css`
  display: grid;
  gap: ${theme.spacing(2)};
  text-align: left;
  text-decoration: none;
  color: inherit;
  align-items: stretch;

  ${theme.breakpoints.up('sm')} {
    width: 330px;
  }

  ${theme.breakpoints.up('md')} {
    width: 290px;
  }
`

const imageStyles = css`
  min-height: inherit;
  object-fit: cover;
`

export function ArticleListItem({className, ...data}: Article & {className?: string}) {
  const theme = useTheme()
  const {
    elements: {Image, Paragraph, H5, Link}
  } = useWebsiteBuilder()

  return (
    <Link css={wrapperStyles(theme)} className={className} href={data.slug}>
      <ArticleListItemImageWrapper>
        {data.image && <Image image={data.image} square css={imageStyles} />}
      </ArticleListItemImageWrapper>

      <ArticleListItemContent>
        <Paragraph gutterBottom={false}>
          {formatDate(new Date(data.publishedAt), 'dd.MM.yyyy')}
        </Paragraph>

        {data.title && <H5>{data.title}</H5>}
        {data.authors && <Paragraph>von {data.authors.map(a => `${a.name} `)}</Paragraph>}
      </ArticleListItemContent>
    </Link>
  )
}
