import styled from '@emotion/styled';
import {
  BuilderTagProps,
  TagSEO,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { ContentWrapper } from '@wepublish/content/website';
import { ArticleListWrapper } from '@wepublish/article/website';
import { useMemo } from 'react';
import { capitalize } from '@mui/material';

export const TagWrapper = styled(ContentWrapper)`
  ${({ theme }) => theme.breakpoints.up('md')} {
    & > :is(${ArticleListWrapper}) {
      grid-column: 2/12;
    }
  }
`;

export const TagTitle = styled('h1')``;

export const TagTitleWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  grid-auto-rows: min-content;
`;

export function Tag({
  className,
  tags,
  articles,
  variables,
  onVariablesChange,
}: BuilderTagProps) {
  const {
    ArticleList,
    elements: { Alert, Pagination, H2 },
    blocks: { RichText },
  } = useWebsiteBuilder();

  const tag = tags.data?.tags?.nodes.at(0);
  const take = variables?.take ?? 1;
  const page = variables?.skip ? variables.skip / take + 1 : 1;

  const pageCount = useMemo(() => {
    if (
      articles.data?.articles?.totalCount &&
      articles.data.articles.totalCount > take
    ) {
      return Math.ceil(articles.data.articles.totalCount / take);
    }

    return 1;
  }, [articles.data?.articles?.totalCount, take]);

  if (!tag) {
    return;
  }

  return (
    <TagWrapper className={className}>
      <TagSEO tag={tag} />

      <TagTitleWrapper>
        <H2 component={TagTitle}>{capitalize(tag.tag ?? '')}</H2>

        {!!tag.description?.length && <RichText richText={tag.description} />}
      </TagTitleWrapper>

      {!articles.loading && !articles.data?.articles?.nodes.length && (
        <Alert severity="info">Keine Artikel vorhanden</Alert>
      )}

      <ArticleList
        {...articles}
        variables={variables}
        onVariablesChange={onVariablesChange}
      />

      {pageCount > 1 && (
        <Pagination
          page={page ?? 1}
          count={pageCount}
          onChange={(_, value) =>
            onVariablesChange?.({
              skip: (value - 1) * take,
            })
          }
        />
      )}
    </TagWrapper>
  );
}
