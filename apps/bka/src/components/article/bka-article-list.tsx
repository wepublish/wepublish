import styled from '@emotion/styled';
import { articleToTeaser } from '@wepublish/article/website';
import { alignmentForTeaserBlock } from '@wepublish/block-content/website';
import { FullArticleTeaserFragment } from '@wepublish/website/api';
import { BuilderArticleListProps } from '@wepublish/website/builder';
import { useMemo } from 'react';

import { BkaBlockStyle } from '../block-styles/bka-block-styles';
import { BkaTextTeaser } from '../teasers/bka-text-teaser';

export const BkaArticleListWrapper = styled('div')`
  display: grid;
  align-content: start;
  row-gap: ${({ theme }) => theme.spacing(3.75)};
`;

export const BkaArticleList = ({
  data,
  className,
}: BuilderArticleListProps) => {
  const teasers = useMemo(
    () =>
      data?.articles?.nodes.map(article =>
        articleToTeaser(article as FullArticleTeaserFragment['article'])
      ) ?? [],
    [data?.articles?.nodes]
  );

  return (
    <BkaArticleListWrapper className={className}>
      {teasers.map((teaser, index) => (
        <BkaTextTeaser
          key={index}
          index={index}
          teaser={teaser}
          blockStyle={BkaBlockStyle.Magazin}
          alignment={alignmentForTeaserBlock(index, 1)}
        />
      ))}
    </BkaArticleListWrapper>
  );
};
