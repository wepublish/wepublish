import styled from '@emotion/styled';
import { ArticleDateWrapper } from '@wepublish/article/website';
import {
  BuilderArticleDateProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

const TsriArticleDateWrapper = styled(ArticleDateWrapper)`
  font-size: 0.875em;
  display: grid;
  background-color: lightgreen;
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
      <time
        suppressHydrationWarning
        dateTime={article.publishedAt}
      >
        {date.format(new Date(article.publishedAt), true)}
      </time>

      {updated && (
        <time
          suppressHydrationWarning
          dateTime={article.latest.publishedAt!}
        >
          Aktualisiert{' '}
          {date.format(new Date(article.latest.publishedAt!), true)}
        </time>
      )}
    </TsriArticleDateWrapper>
  );
};
