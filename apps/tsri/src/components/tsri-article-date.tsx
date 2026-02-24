import styled from '@emotion/styled';
import { ArticleDateWrapper } from '@wepublish/article/website';
import {
  BuilderArticleDateProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

const TsriArticleDateWrapper = styled(ArticleDateWrapper)`
  font-size: 0.7rem;
  display: grid;
  grid-column: 2 / 4;
  grid-row: 2 / 3;
  margin: 0;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-column: 2 / 3;
    grid-row: 2 / 4;
    font-size: 0.875em;
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
