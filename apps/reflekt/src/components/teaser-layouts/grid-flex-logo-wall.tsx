import styled from '@emotion/styled';
import {
  fixFlexTeasers,
  hasBlockStyle,
  isTeaserGridFlexBlock,
  TeaserGridFlexBlockWrapper as TeaserGridFlexBlockWrapperDefault,
} from '@wepublish/block-content/website';
import { BlockContent } from '@wepublish/website/api';
import {
  BuilderTeaserGridFlexBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import { useMemo } from 'react';

import { ReflektBlockStyles } from '../block-styles/reflekt-block-styles';

export const isGridFlexLogoWall = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderTeaserGridFlexBlockProps =>
  allPass([
    isTeaserGridFlexBlock,
    hasBlockStyle(ReflektBlockStyles.TeaserLogoWall),
  ])(block);

export const GridFlexLogoWallWrapper = styled(
  TeaserGridFlexBlockWrapperDefault
)`
  align-items: center;
  justify-items: center;
  display: grid;
  grid-auto-rows: min-content;
  column-gap: ${({ theme }) => theme.spacing(6)};
  row-gap: ${({ theme }) => theme.spacing(3)};
  width: 100%;
  grid-template-columns: repeat(2, 1fr);

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: repeat(14, 1fr);
    column-gap: ${({ theme }) => theme.spacing(4)};
    row-gap: ${({ theme }) => theme.spacing(3)};
  }
`;

export const GridFlexLogoWall = ({
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
    <GridFlexLogoWallWrapper className={className}>
      {sortedTeasers.map((teaser, index) => (
        <Teaser
          key={index}
          index={index}
          {...teaser}
          blockStyle={blockStyle}
        />
      ))}
    </GridFlexLogoWallWrapper>
  );
};
