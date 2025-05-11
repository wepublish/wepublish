import styled from '@emotion/styled'
import {css} from '@mui/material'
import {useHotAndTrendingQuery} from '@wepublish/website/api'
import {useWebsiteBuilder} from '@wepublish/website/builder'

const ArticleChatsWrapper = styled('article')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-column: 2/12;
    gap: ${({theme}) => theme.spacing(5)};
  }
`

const ArticleChatsList = styled('ul')`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  counter-reset: article 0;

  ${({theme}) => theme.breakpoints.up('md')} {
    padding-left: calc((100% / 12) * 2);
    padding-right: calc((100% / 12) * 2);
  }
`

const ArticleChartsItem = styled('div')`
  display: flex;
  flex-flow: row wrap;
  gap: ${({theme}) => theme.spacing(2)};

  ::before {
    content: counter(article);
    counter-increment: article;
    font-size: 44px;
  }
`

const ArticleChartsItemText = styled('div')`
  flex: 1 0 0;
`

const ArticleChartsItemTitle = styled('div')`
  font-weight: bold;
`

const ArticleChartsItemLead = styled('div')``

const articleChartsItemImage = css`
  width: 75px;
  height: 75px;
  object-fit: cover;
`

const articleChartsBigItemImage = css`
  object-fit: cover;
  justify-self: center;
  aspect-ratio: 16/9;
`

export const ArticleCharts = () => {
  const {
    elements: {Image, Link}
  } = useWebsiteBuilder()

  const {data} = useHotAndTrendingQuery({
    variables: {
      take: 4
    }
  })

  if (!data?.hotAndTrending.length) {
    return null
  }

  return (
    <ArticleChatsWrapper>
      {data.hotAndTrending[0].latest.image && (
        <Image image={data.hotAndTrending[0].latest.image} css={articleChartsBigItemImage} />
      )}

      <ArticleChatsList>
        {data.hotAndTrending.map((article, index) => (
          <li key={article.id}>
            <Link href={article.url} color="inherit" underline="none">
              <ArticleChartsItem>
                <ArticleChartsItemText>
                  <ArticleChartsItemTitle>{article.latest.title}</ArticleChartsItemTitle>
                  <ArticleChartsItemLead>{article.latest.lead}</ArticleChartsItemLead>
                </ArticleChartsItemText>

                {index !== 0 && article.latest.image && (
                  <Image image={article.latest.image} css={articleChartsItemImage} />
                )}
              </ArticleChartsItem>
            </Link>
          </li>
        ))}
      </ArticleChatsList>
    </ArticleChatsWrapper>
  )
}
