import styled from '@emotion/styled';
import { FullArticleFragment } from '@wepublish/website/api';
import {
  BuilderArticleAuthorsProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { Typography } from '@mui/material';

export const ArticleAuthorsWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
`;

export const selectArticleAuthors = (
  article: Pick<FullArticleFragment, 'latest'> | null | undefined
) =>
  article?.latest.authors.filter(({ author }) => !author.hideOnArticle) ?? [];

export const ArticleAuthors = ({
  article,
  className,
}: BuilderArticleAuthorsProps) => {
  const { AuthorChip, ArticleDate } = useWebsiteBuilder();
  const authors = selectArticleAuthors(article);

  if (!authors.length) {
    return;
  }

  return (
    <Typography
      variant="articleAuthors"
      component={ArticleAuthorsWrapper}
      className={className}
    >
      {authors.map(({ author, role }) => (
        <AuthorChip
          key={author.id}
          author={author}
          role={role}
        />
      ))}

      <ArticleDate article={article} />
    </Typography>
  );
};
