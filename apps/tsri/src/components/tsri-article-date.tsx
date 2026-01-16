import styled from '@emotion/styled';
import { ArticleDateWrapper } from '@wepublish/article/website';
import {
  BuilderArticleDateProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

const TsriArticleDateWrapper = styled(ArticleDateWrapper)`
  grid-column: -1 / 1;
  grid-row: 1 / 2;
  grid-template-columns: subgrid;
  font-size: 0.7rem;
  display: grid;
  margin-top: unset;
  gap: 4px;
  padding: 1.9rem 0 0 0;
  pointer-events: none;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: subgrid;
    font-size: 0.875em;
    gap: 8px;
    padding: 2.75rem 0 0 0;
  }
`;

export const TsriArticleTime = styled('time')`
  grid-column: 2 / 3;
  padding: 0 0 0 0.2rem;
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
