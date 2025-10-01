import styled from '@emotion/styled';
import {
  BuilderArticleDateProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export const ArticleDateWrapper = styled('time')`
  margin-top: -${({ theme }) => theme.spacing(2)};
`;

export const ArticleDate = ({
  article,
  className,
}: BuilderArticleDateProps) => {
  const { date } = useWebsiteBuilder();

  if (!article?.publishedAt) {
    return;
  }

  return (
    <ArticleDateWrapper
      suppressHydrationWarning
      className={className}
      dateTime={article.publishedAt}
    >
      {date.format(new Date(article.publishedAt), false)}
    </ArticleDateWrapper>
  );
};
