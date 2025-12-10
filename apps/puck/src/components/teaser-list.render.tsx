import { TeaserListBlock } from '@wepublish/block-content/website';
import {
  ArticleSort,
  EventSort,
  FullArticleTeaserFragment,
  FullEventTeaserFragment,
  FullPageTeaserFragment,
  PageSort,
  SortOrder,
  Teaser,
  TeaserType,
  useArticleListQuery,
  useEventListQuery,
  usePageListQuery,
} from '@wepublish/website/api';
import { CSSProperties, useMemo } from 'react';

export type TeaserListProps = {
  className?: string;
  style?: CSSProperties;
  type: TeaserType;
  take: number;
  skip: number;
};

const filter = { tagObjects: [] };

export function TeaserList({
  type,
  take,
  skip,
  className,
  style,
}: TeaserListProps) {
  const article = useArticleListQuery({
    skip: type !== TeaserType.Article,
    variables: {
      take,
      skip,
      sort: ArticleSort.PublishedAt,
      order: SortOrder.Descending,
    },
  });

  const page = usePageListQuery({
    skip: type !== TeaserType.Page,
    variables: {
      take,
      skip,
      sort: PageSort.PublishedAt,
      order: SortOrder.Descending,
    },
  });

  const event = useEventListQuery({
    skip: type !== TeaserType.Event,
    variables: {
      take,
      skip,
      sort: EventSort.StartsAt,
      order: SortOrder.Descending,
    },
  });

  const teasers = useMemo(() => {
    if (type === TeaserType.Article) {
      return (
        article.data?.articles.nodes.map(
          article =>
            ({
              __typename: 'ArticleTeaser',
              type: TeaserType.Article,
              article,
            }) as FullArticleTeaserFragment
        ) ?? []
      );
    }

    if (type === TeaserType.Page) {
      return (
        page.data?.pages.nodes.map(
          page =>
            ({
              __typename: 'PageTeaser',
              type: TeaserType.Page,
              page,
            }) as FullPageTeaserFragment
        ) ?? []
      );
    }

    if (type === TeaserType.Event) {
      return (
        event.data?.events.nodes.map(
          event =>
            ({
              __typename: 'EventTeaser',
              type: TeaserType.Event,
              event,
            }) as FullEventTeaserFragment
        ) ?? []
      );
    }

    return [];
  }, [
    article.data?.articles.nodes,
    event.data?.events.nodes,
    page.data?.pages.nodes,
    type,
  ]);

  return (
    <TeaserListBlock
      className={className}
      style={style}
      skip={skip}
      take={take}
      teaserType={type}
      filter={filter}
      teasers={teasers as Teaser[]}
    />
  );
}
