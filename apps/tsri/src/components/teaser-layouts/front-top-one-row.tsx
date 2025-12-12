import styled from '@emotion/styled';
import { isFilledTeaser } from '@wepublish/block-content/website';
import { FlexAlignment } from '@wepublish/website/api';
import {
  BuilderTeaserSlotsBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriTeaserType } from '../teasers/tsri-base-teaser';

export const TeaserSlotsFrontTopOneRowWrapper = styled('ul')`
  display: grid;
  column-gap: ${({ theme }) => theme.spacing(2)};
  row-gap: ${({ theme }) => theme.spacing(5)};
  align-items: stretch;
  list-style: none;
  margin: 0;
  padding: 0;
  grid-template-columns: repeat(12, 1fr);
`;

export const isTeaserSlotsFrontTopOneRow = allPass([
  ({ blockStyle }: BuilderTeaserSlotsBlockProps) => {
    return blockStyle === 'FrontTopOneRow';
  },
]);

export const teaserBlockStyleByIndex = (
  index: number
): TsriTeaserType | string => {
  switch (index) {
    case 0:
      return TsriTeaserType.FullsizeImage;
    case 1:
      return 'XXXX';
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
      return { ...alignment, x: 8 };
    default:
      return { ...alignment, x: 1, y: index - 1 }; // should never happen
  }
};

export const TeaserSlotsFrontTopOneRow = ({
  teasers,
  className,
  teaserBlockStyleByIndex,
  alignmentForTeaserBlock,
}: BuilderTeaserSlotsBlockProps & {
  teaserBlockStyleByIndex: (index: number) => TsriTeaserType | string;
  alignmentForTeaserBlock: (index: number) => FlexAlignment;
}) => {
  const {
    blocks: { Teaser },
  } = useWebsiteBuilder();

  const filledTeasers = teasers.filter(isFilledTeaser);

  return (
    <TeaserSlotsFrontTopOneRowWrapper className={className}>
      {filledTeasers.map(
        (teaser, index) =>
          index < 2 && (
            <Teaser
              key={index}
              index={index}
              teaser={teaser}
              alignment={alignmentForTeaserBlock(index)}
              blockStyle={teaserBlockStyleByIndex(index)}
            />
          )
      )}
    </TeaserSlotsFrontTopOneRowWrapper>
  );
};
