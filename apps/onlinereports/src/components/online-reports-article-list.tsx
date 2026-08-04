import {
  ArticleListWrapper,
  articleToTeaser,
} from '@wepublish/article/website';
import {
  FullArticleTeaserFragment,
  FullTeaserFragment,
  TeaserType,
} from '@wepublish/website/api';
import {
  BuilderArticleListProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useMemo } from 'react';

export function OnlineReportsArticleList({
  data,
  className,
}: BuilderArticleListProps) {
  const {
    blocks: { TeaserGrid },
  } = useWebsiteBuilder();

  const teasers = useMemo(
    () =>
      enrichTeaserListWithOnlineReportsAds(
        data?.articles?.nodes.map(article =>
          articleToTeaser(article as FullArticleTeaserFragment['article'])
        ) ?? []
      ),
    [data?.articles?.nodes]
  );

  return (
    <ArticleListWrapper className={className}>
      <TeaserGrid
        numColumns={3}
        teasers={teasers}
      />
    </ArticleListWrapper>
  );
}

function enrichTeaserListWithOnlineReportsAds(teasers: FullTeaserFragment[]) {
  return teasers.reduce(
    (teasers: FullTeaserFragment[], teaser: FullTeaserFragment, index) => {
      if ((index + 3) % 6 === 0) {
        teasers.push({
          __typename: 'CustomTeaser',
          type: TeaserType.Custom,
          title: 'ad-small',
        });
      }
      teasers.push(teaser);
      return teasers;
    },
    []
  );
}
