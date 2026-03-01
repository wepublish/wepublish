import { ArticleDateWrapper } from '@wepublish/article/website';
import {
  BuilderArticleDateProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export const HauptstadtArticleDate = ({
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
    <ArticleDateWrapper
      suppressHydrationWarning
      className={className}
    >
      {date.format(new Date(article.publishedAt), false)}

      {updated && (
        <time
          suppressHydrationWarning
          dateTime={article.latest.publishedAt!}
        >
          {' '}
          (Aktualisiert am{' '}
          {date.format(new Date(article.latest.publishedAt!), false)})
        </time>
      )}
    </ArticleDateWrapper>
  );
};
