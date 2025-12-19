import styled from '@emotion/styled';
import { css } from '@mui/material';
import { fixFlexTeasers } from '@wepublish/block-content/website';
import { FlexAlignment } from '@wepublish/website/api';
import {
  BuilderTeaserGridFlexBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import { useMemo } from 'react';

import { TsriTeaserType } from '../teasers/tsri-base-teaser';

export const isTeaserFlexGridFrontMiddle = allPass([
  ({ blockStyle }: BuilderTeaserGridFlexBlockProps) => {
    return blockStyle === 'FrontMiddle';
  },
]);

export const teaserBlockStyleByIndex = (index: number): TsriTeaserType => {
  switch (index) {
    case 0:
    case 1:
      return TsriTeaserType.FullsizeImage;
    case 2:
    case 3:
    case 4:
      return TsriTeaserType.NoImageAltColor;
    case 5:
    case 6:
    case 7:
      return TsriTeaserType.TwoColAltColor;
    default:
      return TsriTeaserType.NoImage; // should never happen
  }
};

export const alignmentForTeaserBlock = (index: number): FlexAlignment => {
  const alignment = {
    i: index.toString(),
    static: false,
    h: 1, // how many rows high
    w: 4, // how many columns wide
    x: 0, // starting column - 1
    y: 0, // starting row - 1
  };
  switch (index) {
    case 0:
      return { ...alignment, w: 6 }; // first row
    case 1:
      return { ...alignment, x: 6, w: 6 };
    case 2:
      return { ...alignment, y: 1 }; // second row
    case 3:
      return { ...alignment, x: 4, y: 1 };
    case 4:
      return { ...alignment, x: 8, y: 1 };
    case 5:
      return { ...alignment, y: 2 }; // third row
    case 6:
      return { ...alignment, x: 4, y: 2 };
    case 7:
      return { ...alignment, x: 8, y: 2 };
    default:
      return { ...alignment }; // should never happen
  }
};

export const TeaserGridFlexBlockWrapper = styled('ul')`
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

export const TeaserFlexGridFrontMiddle = ({
  flexTeasers,
  className,
  alignmentForTeaserBlock,
  teaserBlockStyleByIndex,
}: BuilderTeaserGridFlexBlockProps & {
  alignmentForTeaserBlock: (index: number) => FlexAlignment;
  teaserBlockStyleByIndex: (index: number) => TsriTeaserType;
}) => {
  const {
    blocks: { Teaser },
  } = useWebsiteBuilder();

  const sortedTeasers = useMemo(
    () => (flexTeasers ? fixFlexTeasers(flexTeasers) : []),
    [flexTeasers]
  );

  return (
    <TeaserGridFlexBlockWrapper className={className}>
      {sortedTeasers.map(
        (teaser, index) =>
          index < 8 && (
            <Teaser
              key={index}
              index={index}
              {...teaser}
              alignment={alignmentForTeaserBlock(index)}
              blockStyle={teaserBlockStyleByIndex(index)}
            />
          )
      )}
    </TeaserGridFlexBlockWrapper>
  );
};
