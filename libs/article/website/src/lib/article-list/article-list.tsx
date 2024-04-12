import {Pagination, css, styled} from '@mui/material'
import {BuilderArticleListProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {useEffect, useMemo, useState} from 'react'

export const PaginationStyled = styled(Pagination)`
  grid-column: 1 / 5;
  display: grid;
  justify-content: center;
`

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

export const ArticleList = ({data, className, onVariablesChange}: BuilderArticleListProps) => {
  const {ArticleListItem} = useWebsiteBuilder()
  const [page, setPage] = useState(1)
  const limit = 10

  const articleListVariables = {
    take: limit,
    skip: (page - 1) * limit
  }

  const paginationCount = useMemo(() => {
    if (data?.articles.totalCount && data?.articles.totalCount > limit) {
      return Math.ceil(data.articles.totalCount / limit)
    }
    return 1
  }, [data?.articles.totalCount, limit])

  useEffect(() => {
    onVariablesChange && onVariablesChange(articleListVariables)
  }, [page])

  return (
    <ArticleListWrapper className={className}>
      {data?.articles?.nodes.map(article => (
        <ArticleListItem key={article.id} {...(article as any)} />
      ))}
      {paginationCount > 1 && (
        <PaginationStyled count={paginationCount} onChange={(_, value) => setPage(value)} />
      )}
    </ArticleListWrapper>
  )
}
