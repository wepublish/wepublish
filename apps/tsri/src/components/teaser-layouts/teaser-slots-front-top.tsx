import styled from '@emotion/styled';
import { isFilledTeaser } from '@wepublish/block-content/website';
import { FlexAlignment } from '@wepublish/website/api';
import {
  BuilderTeaserSlotsBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriTeaserType } from '../teasers/tsri-base-teaser';

export const TeaserSlotsFrontTopWrapper = styled('ul')`
  display: grid;
  column-gap: ${({ theme }) => theme.spacing(2)};
  row-gap: ${({ theme }) => theme.spacing(5)};
  align-items: stretch;
  list-style: none;
  margin: 0;
  padding: 0;
  grid-template-columns: repeat(12, 1fr);
`;

export const isTeaserSlotsFrontTop = allPass([
  ({ blockStyle }: BuilderTeaserSlotsBlockProps) => {
    return blockStyle === 'FrontTop';
  },
]);

export const teaserBlockStyleByIndex = (index: number): TsriTeaserType => {
  switch (index) {
    default:
      return TsriTeaserType.FullsizeImage;
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
      return { ...alignment, w: 8 };
    case 1:
      return { ...alignment, y: 1 }; // second row
    case 2:
      return { ...alignment, x: 4, y: 1 };
    case 3:
      return { ...alignment, x: 8, y: 1 };
    case 4:
      return { ...alignment, y: 2 }; // third row
    case 5:
      return { ...alignment, x: 4, y: 2 };
    case 6:
      return { ...alignment, x: 8, y: 2 };
    default:
      return { ...alignment, x: 1, y: index - 1 }; // should never happen
  }
};

export const TeaserSlotsFrontTop = ({
  teasers,
  className,
  teaserBlockStyleByIndex,
  alignmentForTeaserBlock,
}: BuilderTeaserSlotsBlockProps & {
  teaserBlockStyleByIndex: (index: number) => TsriTeaserType;
  alignmentForTeaserBlock: (index: number) => FlexAlignment;
}) => {
  const {
    blocks: { Teaser },
  } = useWebsiteBuilder();

  const filledTeasers = teasers.filter(isFilledTeaser);

  return (
    <TeaserSlotsFrontTopWrapper className={className}>
      {filledTeasers.map(
        (teaser, index) =>
          index < 7 && (
            <Teaser
              key={index}
              index={index}
              teaser={teaser}
              alignment={alignmentForTeaserBlock(index)}
              blockStyle={teaserBlockStyleByIndex(index)}
            />
          )
      )}
    </TeaserSlotsFrontTopWrapper>
  );
};
