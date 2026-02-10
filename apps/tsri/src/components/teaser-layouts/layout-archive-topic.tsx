import styled from '@emotion/styled';
import { isFilledTeaser } from '@wepublish/block-content/website';
import { FlexAlignment } from '@wepublish/website/api';
import {
  BuilderTeaserSlotsBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriTeaserType } from '../teasers/tsri-base-teaser';
import { TsriLayoutType } from './tsri-layout';

export const TeaserSlotsArchiveTopicWrapper = styled('div')`
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
  column-gap: 2.2cqw;
  row-gap: 4cqw;

  ${({ theme }) => theme.breakpoints.up('md')} {
    row-gap: 1.77cqw;
    grid-template-columns: 58.42cqw 32.5cqw !important;
    grid-template-rows: repeat(6, min-content) !important;
  }
`;

export const isTeaserSlotsArchiveTopic = allPass([
  ({ blockStyle }: BuilderTeaserSlotsBlockProps) => {
    return blockStyle === TsriLayoutType.ArchiveTopic;
  },
]);

export const teaserBlockStyleByIndex = (index: number): TsriTeaserType => {
  switch (index) {
    case 0:
      return TsriTeaserType.TwoRow;
    case 6:
      return TsriTeaserType.MoreAbout;
    default:
      return TsriTeaserType.NoImage;
  }
};

export const alignmentForTeaserBlock = (index: number): FlexAlignment => {
  const alignment = {
    i: index.toString(),
    static: false,
    h: 1, // how many rows high
    w: 1, // how many columns wide
    x: 0, // starting column - 1
    y: 0, // starting row - 1
  };
  switch (index) {
    case 0:
      return { ...alignment, h: 5 };
    case 6:
      return { ...alignment, w: 2, y: 6 };
    default:
      return { ...alignment, x: 1, y: index - 1 };
  }
};

export const TeaserSlotsArchiveTopic = ({
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
    <TeaserSlotsArchiveTopicWrapper className={className}>
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
    </TeaserSlotsArchiveTopicWrapper>
  );
};
