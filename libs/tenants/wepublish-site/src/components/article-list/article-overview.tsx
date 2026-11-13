import { CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import { SlimArticleFragment } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

import { designText } from '../../theme';
import { ArticleRow, ArticleRows } from './article-row';

export const articlesPerPage = 10;

export const ArticleOverviewWrapper = styled('div')`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(8)};

  // As much room below the navbar as a page that opens with a title block
  ${({ theme }) => theme.breakpoints.up('md')} {
    gap: 120px;
    padding-top: 60px;
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    padding-top: 100px;
  }
`;

// Plain numbers in the mono font, the current page on a light grey
export const ArticleOverviewPagination = styled('div')`
  display: flex;
  justify-content: flex-end;

  .MuiPagination-ul {
    flex-wrap: nowrap;
  }

  // Smaller on phones, so that all the numbers fit in one row
  .MuiPaginationItem-root {
    ${designText.textSmallMono as CSSObject}
    min-width: 32px;
    height: 32px;
    margin: 0;
    padding: 0 4px;
    border: none;
    border-radius: 3px;
    color: ${({ theme }) => theme.palette.common.black};

    &:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }

    &.Mui-selected,
    &.Mui-selected:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }

    ${({ theme }) => theme.breakpoints.up('sm')} {
      min-width: 41px;
      height: 41px;
      margin: 0 2.5px;
      padding: 0 6px;
    }
  }
`;

export const isInLanguage =
  (locale: string | undefined) =>
  ({ slug }: Pick<SlimArticleFragment, 'slug'>) =>
    !locale || !!slug?.endsWith(`-${locale}`);

/**
 * All articles of the current language (the slug ends with it), ten per page,
 * below the title of the overview.
 */
export const WepArticleOverview = ({
  articles,
  page = 1,
  onPageChange,
}: {
  articles: SlimArticleFragment[];
  page?: number;
  onPageChange: (page: number) => void;
}) => {
  const { t } = useTranslation();
  const { locale } = useRouter();
  const {
    blocks: { Title },
    elements: { Pagination },
  } = useWebsiteBuilder();

  const inLanguage = articles.filter(
    isInLanguage(locale !== 'default' ? locale : undefined)
  );
  const pageCount = Math.max(1, Math.ceil(inLanguage.length / articlesPerPage));
  const onPage = inLanguage.slice(
    (page - 1) * articlesPerPage,
    page * articlesPerPage
  );

  return (
    <ArticleOverviewWrapper>
      <Title
        __typename="TitleBlock"
        blockStyle={null}
        preTitle={t('articleList.overviewPreTitle')}
        title={t('articleList.overviewTitle')}
        lead={null}
      />

      <ArticleRows>
        {onPage.map(article => (
          <ArticleRow
            key={article.id}
            href={article.url}
            image={article.latest.image}
            title={article.latest.title}
            lead={article.latest.lead}
            authors={
              article.latest.hideAuthor ?
                []
              : article.latest.authors.map(({ author }) => author.name)
            }
            date={article.publishedAt}
          />
        ))}
      </ArticleRows>

      {pageCount > 1 && (
        <ArticleOverviewPagination>
          <Pagination
            page={page}
            count={pageCount}
            showFirstButton
            showLastButton
            onChange={(_, value) => onPageChange(value)}
          />
        </ArticleOverviewPagination>
      )}
    </ArticleOverviewWrapper>
  );
};
