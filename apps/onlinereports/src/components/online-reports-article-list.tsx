import {
  ArticleListWrapper,
  articleToTeaser,
} from '@wepublish/article/website';
import { Article, Teaser, TeaserType } from '@wepublish/website/api';
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
          articleToTeaser(article as Article)
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

function enrichTeaserListWithOnlineReportsAds(teasers: Teaser[]) {
  return teasers.reduce((teasers: Teaser[], teaser: Teaser, index) => {
    if ((index + 3) % 6 === 0) {
      teasers.push({
        __typename: 'CustomTeaser',
        type: TeaserType.Custom,
        title: 'ad-small',
      });
    }
    teasers.push(teaser);
    return teasers;
  }, []);
}
