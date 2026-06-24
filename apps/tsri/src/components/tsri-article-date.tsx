import styled from '@emotion/styled';
import { css } from '@mui/material';
import { ArticleDateWrapper } from '@wepublish/article/website';
import {
  BuilderArticleDateProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

const TsriArticleDateWrapper = styled(ArticleDateWrapper, {
  shouldForwardProp: prop => prop !== 'hideAuthor',
})<{ hideAuthor?: boolean }>`
  font-size: 0.666rem;
  display: grid;
  grid-column: 2 / 4;
  grid-row: 2 / 3;
  margin: 0;
  grid-auto-rows: min-content;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-column: 2 / 3;
    grid-row: 2 / 4;
    font-size: 0.625rem;
    font-weight: 700;

    ${({ hideAuthor }) =>
      hideAuthor &&
      css`
        grid-column: 1 / 3;
      `}
  }
`;

export const TsriArticleTime = styled('time')`
  padding: 0;
  grid-row: 1 / 2;
  grid-column: -1 / 1;

  &:is(time + time) {
    grid-row: 2 / 3;
  }
`;

export const TsriArticleDate = ({
  article,
  className,
}: BuilderArticleDateProps) => {
  const { date } = useWebsiteBuilder();

  if (!article?.publishedAt) {
    return;
  }

  const updated =
    !!article.latest.publishedAt &&
    article.latest.publishedAt !== article.publishedAt;

  return (
    <TsriArticleDateWrapper
      as={'div'}
      suppressHydrationWarning
      className={className}
      hideAuthor={article.latest.hideAuthor}
    >
      <TsriArticleTime
        suppressHydrationWarning
        dateTime={article.publishedAt}
      >
        {date.format(new Date(article.publishedAt), true)}
      </TsriArticleTime>

      {updated && (
        <TsriArticleTime
          suppressHydrationWarning
          dateTime={article.latest.publishedAt!}
        >
          Aktualisiert{' '}
          {date.format(new Date(article.latest.publishedAt!), true)}
        </TsriArticleTime>
      )}
    </TsriArticleDateWrapper>
  );
};
