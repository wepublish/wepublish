import styled from '@emotion/styled';
import { css } from '@mui/material';
import {
  fixFlexTeasers,
  isFilledTeaser,
} from '@wepublish/block-content/website';
import { FlexAlignment } from '@wepublish/website/api';
import {
  BuilderTeaserGridFlexBlockProps,
  BuilderTeaserSlotsBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useMemo } from 'react';

export const TeaserLayoutWrapper = styled('ul')`
  display: grid;
  column-gap: ${({ theme }) => theme.spacing(2)};
  row-gap: ${({ theme }) => theme.spacing(5)};
  align-items: stretch;
  list-style: none;
  margin: 0;
  padding: 0;
  grid-template-columns: repeat(12, 1fr);

  /*
  ${({ theme }) => css`
    ${theme.breakpoints.up('sm')} {
      grid-template-columns: 1fr 1fr;
    }

    ${theme.breakpoints.up('md')} {
      grid-template-columns: repeat(12, 1fr);
    }
  `}
  */
`;

export const alignmentForTeaserBlock = (index: number): FlexAlignment => {
  const alignment = {
    i: index.toString(),
    static: false,
    h: 1, // how many rows high
    w: 4, // how many columns wide
    x: 0, // starting column - 1
    y: 0, // starting row - 1
  };
  return {
    ...alignment,
    x: (index % 3) * alignment.w,
    y: Math.floor(index / 3),
  };
};

export const TeaserFlexGrid = ({
  flexTeasers,
  className,
  alignmentForTeaserBlock,
  blockStyle,
}: BuilderTeaserGridFlexBlockProps & {
  alignmentForTeaserBlock: (index: number) => FlexAlignment;
}) => {
  const {
    blocks: { Teaser },
  } = useWebsiteBuilder();

  const sortedTeasers = useMemo(
    () => (flexTeasers ? fixFlexTeasers(flexTeasers) : []),
    [flexTeasers]
  );

  return (
    <TeaserLayoutWrapper className={className}>
      {sortedTeasers.map((teaser, index) => (
        <Teaser
          key={index}
          index={index}
          {...teaser}
          alignment={alignmentForTeaserBlock(index)}
          blockStyle={blockStyle}
        />
      ))}
    </TeaserLayoutWrapper>
  );
};

export const TeaserSlots = ({
  teasers,
  className,
  alignmentForTeaserBlock,
  blockStyle,
}: BuilderTeaserSlotsBlockProps & {
  alignmentForTeaserBlock: (index: number) => FlexAlignment;
}) => {
  const {
    blocks: { Teaser },
  } = useWebsiteBuilder();

  const filledTeasers = teasers.filter(isFilledTeaser);

  return (
    <TeaserLayoutWrapper className={className}>
      {filledTeasers.map((teaser, index) => (
        <Teaser
          key={index}
          index={index}
          teaser={teaser}
          alignment={alignmentForTeaserBlock(index)}
          blockStyle={blockStyle}
        />
      ))}
    </TeaserLayoutWrapper>
  );
};
