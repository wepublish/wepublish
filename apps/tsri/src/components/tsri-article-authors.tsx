import styled from '@emotion/styled';
import { css, Typography } from '@mui/material';
import {
  BuilderArticleAuthorsProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { ComponentProps, ComponentType, Fragment } from 'react';

import { AuthorChipNameJobWrapper } from './tsri-author-chip';

export const ArticleAuthorsWrapper = styled('div', {
  shouldForwardProp: prop => prop !== 'hasMultipleAuthors',
})<{ hasMultipleAuthors?: boolean }>`
  ${({ hasMultipleAuthors }) =>
    !hasMultipleAuthors &&
    css`
      display: contents;
    `}
  grid-column: 1 / 4;
`;

export const TsriArticleAuthors = ({
  article,
  className,
}: BuilderArticleAuthorsProps) => {
  const { AuthorChip: AuthorChipBase, ArticleDate } = useWebsiteBuilder();
  const AuthorChip = AuthorChipBase as ComponentType<
    ComponentProps<typeof AuthorChipBase> & {
      isOneOfMultipleAuthors?: boolean;
    }
  >;
  const authors =
    article?.latest.authors.filter(author => !author.hideOnArticle) || [];

  if (!authors.length) {
    return;
  }

  const hasMultipleAuthors = authors.length > 1;

  return (
    <Typography
      variant="articleAuthors"
      component={ArticleAuthorsWrapper}
      hasMultipleAuthors={hasMultipleAuthors}
      className={className}
    >
      {!hasMultipleAuthors && <AuthorChip author={authors[0]} />}

      {hasMultipleAuthors && (
        <AuthorChipNameJobWrapper>
          {'Von '}
          {authors.map((author, index) => (
            <Fragment key={author.id}>
              <AuthorChip
                author={{ ...author, image: undefined, links: [] }}
                isOneOfMultipleAuthors
              />
              {index < authors.length - 1 && ', '}
            </Fragment>
          ))}
        </AuthorChipNameJobWrapper>
      )}

      <ArticleDate article={article} />
    </Typography>
  );
};
