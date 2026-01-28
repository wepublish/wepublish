import styled from '@emotion/styled';
import {
  BuilderArticleAuthorsProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { Article as ArticleType } from '@wepublish/website/api';
import { Typography } from '@mui/material';

export const ArticleAuthorsWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
`;

export const ArticleAuthors = ({
  article,
  className,
}: BuilderArticleAuthorsProps) => {
  const { AuthorChip, ArticleDate } = useWebsiteBuilder();
  const authors =
    article?.latest.authors.filter(author => !author.hideOnArticle) || [];

  if (!authors.length) {
    return;
  }

  return (
    <Typography
      variant="articleAuthors"
      component={ArticleAuthorsWrapper}
      className={className}
    >
      {authors.map(author => (
        <AuthorChip
          key={author.id}
          author={author}
        />
      ))}

      <ArticleDate article={article as ArticleType} />
    </Typography>
  );
};
