import {css, styled} from '@mui/material'
import {BuilderArticleListProps, useWebsiteBuilder} from '@wepublish/website/builder'

export const ArticleListWrapper = styled('article')`
  display: grid;
  gap: ${({theme}) => theme.spacing(4)};
  grid-template-columns: repeat(1, 1fr);

  ${({theme}) => css`
    ${theme.breakpoints.up('sm')} {
      grid-template-columns: repeat(2, 1fr);
    }

    ${theme.breakpoints.up('md')} {
      grid-template-columns: repeat(3, 1fr);
    }

    ${theme.breakpoints.up('lg')} {
      grid-template-columns: repeat(4, 1fr);
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
