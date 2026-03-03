import {
  ArticleListWrapper,
  articleToTeaser,
} from '@wepublish/article/website';
import { Article } from '@wepublish/website/api';
import {
  BuilderArticleListProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useMemo } from 'react';

import { ReflektBlockType } from '../block-styles/reflekt-block-styles';

export const ReflektArticleList = ({
  data,
  className,
  tag,
}: BuilderArticleListProps) => {
  const {
    blocks: { TeaserGrid },
  } = useWebsiteBuilder();

  const teasers = useMemo(
    () =>
      data?.articles?.nodes.map(article =>
        articleToTeaser(article as Article)
      ) ?? [],
    [data?.articles?.nodes]
  );

  const blockStyle = useMemo(() => {
    if (tag) {
      if (tag === 'research') {
        return ReflektBlockType.TeaserResearch;
      }

      if (tag === 'news') {
        return ReflektBlockType.TeaserNews;
      }
    }

    return undefined;
  }, [tag]);

  return (
    <ArticleListWrapper className={className}>
      <TeaserGrid
        numColumns={3}
        teasers={teasers}
        blockStyle={blockStyle}
      />
    </ArticleListWrapper>
  );
};
