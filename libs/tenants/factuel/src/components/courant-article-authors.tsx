import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { selectArticleAuthors } from '@wepublish/article/website';
import {
  BuilderArticleAuthorsProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

import { courantTokens } from '../brand-tokens';

const { blockGaps } = courantTokens.layout;
const { warmGray } = courantTokens.colors;

const CourantArticleAuthorsWrapper = styled('aside')`
  display: grid;
  grid-template-rows: auto auto;
  row-gap: ${({ theme }) => theme.spacing(blockGaps.articleMeta)};

  time {
    font-family: var(--courant-captions);
    font-size: ${courantTokens.typography.sizes.caption};
    font-weight: 700;
    letter-spacing: 0;
    color: ${warmGray[700]};
  }
`;

const AuthorsColumn = styled('div')`
  display: grid;
  row-gap: ${({ theme }) => theme.spacing(blockGaps.articleMetaAuthors)};
`;

export const CourantArticleAuthors = ({
  article,
  className,
}: BuilderArticleAuthorsProps) => {
  const { AuthorChip, ArticleDate } = useWebsiteBuilder();
  const authors = selectArticleAuthors(article);

  if (!authors.length) {
    return null;
  }

  return (
    <Typography
      variant="articleAuthors"
      component={CourantArticleAuthorsWrapper}
      className={className}
    >
      <AuthorsColumn>
        {authors.map(({ author, role }) => (
          <AuthorChip
            key={author.id}
            author={author}
            role={role}
          />
        ))}
      </AuthorsColumn>

      <ArticleDate article={article} />
    </Typography>
  );
};
