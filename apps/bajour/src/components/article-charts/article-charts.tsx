import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { useHotAndTrendingQuery } from '@wepublish/website/api';
import { Image, Link, useWebsiteBuilder } from '@wepublish/website/builder';

const ArticleChartsWrapper = styled('article')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: 0 ${({ theme }) => theme.spacing(4)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-column: 2/12;
    padding-left: calc((100% / 12) * 2);
    padding-right: calc((100% / 12) * 2);
  }
`;

const ArticleChartsContent = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    gap: ${({ theme }) => theme.spacing(5)};
  }
`;

const ArticleChartsTitle = styled('h2')`
  padding-left: ${({ theme }) => theme.spacing(3)};
  padding-right: ${({ theme }) => theme.spacing(3)};
`;

const ArticleChartsList = styled('ul')`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  counter-reset: article 0;
`;

const ArticleChartsItem = styled('div')`
  display: flex;
  flex-flow: row wrap;
  gap: ${({ theme }) => theme.spacing(2)};

  ::before {
    content: counter(article);
    counter-increment: article;
    font-size: 44px;
  }
`;

const ArticleChartsItemText = styled('div')`
  flex: 1 0 0;
`;

const ArticleChartsItemTitle = styled('div')`
  font-weight: bold;
`;

const ArticleChartsItemLead = styled('div')``;

const ArticleChartsItemImage = styled(Image)`
  width: 75px;
  height: 75px;
  object-fit: cover;
`;

const ArticleChartsBigItemImage = styled(Image)`
  object-fit: cover;
  justify-self: center;
  aspect-ratio: 16/9;
`;

const uppercase = css`
  text-transform: uppercase;
`;

export const ArticleCharts = () => {
  const { data } = useHotAndTrendingQuery({
    variables: {
      take: 4,
    },
  });
  const {
    elements: { H5 },
  } = useWebsiteBuilder();

  if (!data?.hotAndTrending.length) {
    return null;
  }

  return (
    <ArticleChartsWrapper>
      <H5
        component={ArticleChartsTitle}
        css={uppercase}
      >
        Artikel Charts
      </H5>

      <ArticleChartsContent>
        {data.hotAndTrending[0].latest.image && (
          <ArticleChartsBigItemImage
            image={data.hotAndTrending[0].latest.image}
          />
        )}

        <ArticleChartsList>
          {data.hotAndTrending.map((article, index) => (
            <li key={article.id}>
              <Link
                href={article.url}
                color="inherit"
                underline="none"
              >
                <ArticleChartsItem>
                  <ArticleChartsItemText>
                    <ArticleChartsItemTitle>
                      {article.latest.title}
                    </ArticleChartsItemTitle>

                    <ArticleChartsItemLead>
                      {article.latest.lead}
                    </ArticleChartsItemLead>
                  </ArticleChartsItemText>

                  {index !== 0 && article.latest.image && (
                    <ArticleChartsItemImage image={article.latest.image} />
                  )}
                </ArticleChartsItem>
              </Link>
            </li>
          ))}
        </ArticleChartsList>
      </ArticleChartsContent>
    </ArticleChartsWrapper>
  );
};
