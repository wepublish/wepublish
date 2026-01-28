import { css } from '@mui/material';
import styled from '@emotion/styled';
import {
  BlockContent,
  FlexTeaser,
  TeaserGridFlexBlock as TeaserGridFlexBlockType,
} from '@wepublish/website/api';
import {
  BuilderTeaserGridFlexBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { ascend, compose, filter, sortWith } from 'ramda';
import { useMemo } from 'react';
import { isFilledTeaser } from './teaser-grid-block';

export const isTeaserGridFlexBlock = (
  block: Pick<BlockContent, '__typename'>
): block is TeaserGridFlexBlockType =>
  block.__typename === 'TeaserGridFlexBlock';

export const TeaserGridFlexBlockWrapper = styled('div')`
  display: grid;
  column-gap: ${({ theme }) => theme.spacing(2)};
  row-gap: ${({ theme }) => theme.spacing(5)};
  grid-template-columns: 1fr;
  align-items: stretch;

  ${({ theme }) => css`
    ${theme.breakpoints.up('sm')} {
      grid-template-columns: 1fr 1fr;
    }

    ${theme.breakpoints.up('md')} {
      grid-template-columns: repeat(12, 1fr);
    }
  `}
`;

const sortFlexTeasersByYAndX = sortWith<FlexTeaser>([
  ascend(teaser => teaser.alignment.y),
  ascend(teaser => teaser.alignment.x),
]);

export const omitEmptyFlexTeasers = filter<FlexTeaser>(teaser =>
  isFilledTeaser(teaser.teaser)
);

export const fixFlexTeasers = compose(
  sortFlexTeasersByYAndX,
  omitEmptyFlexTeasers
);

export const TeaserGridFlexBlock = ({
  flexTeasers,
  blockStyle,
  className,
}: BuilderTeaserGridFlexBlockProps) => {
  const {
    blocks: { Teaser },
  } = useWebsiteBuilder();

  const sortedTeasers = useMemo(
    () => (flexTeasers ? fixFlexTeasers(flexTeasers) : []),
    [flexTeasers]
  );

  return (
    <TeaserGridFlexBlockWrapper className={className}>
      {sortedTeasers.map((teaser, index) => (
        <Teaser
          key={index}
          index={index}
          {...teaser}
          blockStyle={blockStyle}
        />
      ))}
    </TeaserGridFlexBlockWrapper>
  );
};
