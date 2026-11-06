import styled from '@emotion/styled';
import { articleToTeaser } from '@wepublish/article/website';
import { FullArticleTeaserFragment } from '@wepublish/website/api';
import {
  BuilderArticleListProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useMemo } from 'react';

import { courantTokens } from '../brand-tokens';

const { pageMaxWidth } = courantTokens.layout;

const CourantArticleListWrapper = styled('section')`
  width: 100%;
  max-width: ${pageMaxWidth}px;
  margin-inline: auto;
`;

export const CourantArticleList = ({
  data,
  className,
}: BuilderArticleListProps) => {
  const {
    blocks: { TeaserGrid },
  } = useWebsiteBuilder();

  const teasers = useMemo(
    () =>
      data?.articles?.nodes.map(article =>
        articleToTeaser(article as FullArticleTeaserFragment['article'])
      ) ?? [],
    [data?.articles?.nodes]
  );

  if (!teasers.length) {
    return null;
  }

  return (
    <CourantArticleListWrapper className={className}>
      <TeaserGrid
        title={null}
        numColumns={3}
        teasers={teasers}
      />
    </CourantArticleListWrapper>
  );
};
