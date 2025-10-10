import styled from '@emotion/styled';
import { ArticleContainer } from './article-container';
import { ArticleListContainer } from './article-list/article-list-container';
import {
  ArticleQuery,
  ArticleSort,
  SortOrder,
  Tag,
  TagType,
  useTagListQuery,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { ComponentProps } from 'react';

export const ArticleRecentWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-column: 1/12;
  }
`;

export type ArticleRecentProps = {
  article: ArticleQuery['article'];
  className?: string;
  children?: React.ReactNode;
  excludeTags?: string[];
  nrOfRecentArticles?: number;
};

export function ArticleRecent({
  article,
  excludeTags = [],
  nrOfRecentArticles = 4,
}: ArticleRecentProps) {
  const tags = useTagListQuery({
    variables: {
      filter: {
        tags: excludeTags,
        type: TagType.Article,
      },
      take: 100,
    },
  });
  const {
    elements: { H2 },
  } = useWebsiteBuilder();
  const { slug, id } = article;

  const containerProps = {
    slug,
    id,
  } as ComponentProps<typeof ArticleContainer>;

  return (
    <>
      <ArticleContainer {...containerProps} />

      {tags.data && (
        <ArticleRecentWrapper>
          <H2 component={'h2'}>Aktuelle Beiträge</H2>

          <ArticleListContainer
            variables={{
              sort: ArticleSort.PublishedAt,
              order: SortOrder.Descending,
              take: nrOfRecentArticles + 1,
              filter: {
                tagsNotIn: tags.data.tags.nodes.map((tag: Tag) => tag.id),
              },
            }}
            filter={articles =>
              articles
                .filter(article => article.id !== id)
                .splice(0, nrOfRecentArticles)
            }
          />
          <div id={'comments'} />
        </ArticleRecentWrapper>
      )}
    </>
  );
}
