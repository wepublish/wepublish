import {css, styled} from '@mui/material'
import {BuilderArticleListProps, useWebsiteBuilder} from '@wepublish/website/builder'

export const ArticleListWrapper = styled('article')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};

  ${({theme}) => css`
    ${theme.breakpoints.up('sm')} {
      grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
    }

    ${theme.breakpoints.up('md')} {
      grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    }
  `}
`

export const ArticleList = ({data, className}: BuilderArticleListProps) => {
  const {ArticleListItem} = useWebsiteBuilder()

  return (
    <ArticleListWrapper className={className}>
      {data?.articles?.nodes.map(article => (
        <ArticleListItem key={article.id} {...(article as any)} />
      ))}
    </ArticleListWrapper>
  )
}
