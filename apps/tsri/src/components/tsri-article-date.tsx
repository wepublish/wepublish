import styled from '@emotion/styled';
import { ArticleDateWrapper } from '@wepublish/article/website';
import {
  BuilderArticleDateProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

const TsriArticleDateWrapper = styled(ArticleDateWrapper)`
  font-size: 0.7rem;
  display: contents;

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: 0.875em;
  }
`;

export const TsriArticleTime = styled('time')`
  grid-column: 2 / 4;
  grid-row: 2 / 3;
  padding: 0;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-column: 2 / 3;
    grid-row: 2 / 4;
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
