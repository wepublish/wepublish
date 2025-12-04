import styled from '@emotion/styled';
import { isFilledTeaser } from '@wepublish/block-content/website';
import {
  BuilderTeaserSlotsBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriTeaserTypes } from '../teasers/tsri-base-teaser';
import { FlexAlignment } from '@wepublish/website/api';

export const TeaserSlotsArchiveTopicWrapper = styled('section')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
`;

export const TeaserSlotsArchiveTopicTeasers = styled('div')`
  display: grid;

  @container tabbed-content (width > 200px) {
    grid-template-columns: 58.42cqw 32.5cqw !important;
    column-gap: 2.2cqw;
    row-gap: 1.77cqw;
  }
`;

export const isTeaserSlotsArchiveTopic = allPass([
  ({ blockStyle }: BuilderTeaserSlotsBlockProps) => {
    return blockStyle === 'ArchiveTopic';
  },
]);

export const TeaserSlotsArchiveTopic = ({
  teasers,
  className,
}: BuilderTeaserSlotsBlockProps) => {
  const {
    blocks: { Teaser },
  } = useWebsiteBuilder();

  const filledTeasers = teasers.filter(isFilledTeaser);

  const teaserBlockStyleByIndex = (index: number) => {
    switch (index) {
      case 0:
        return TsriTeaserTypes.TwoRow;
      case 6:
        return TsriTeaserTypes.MoreAbout;
      default:
        return TsriTeaserTypes.NoImage;
    }
  };

  /*
  export const alignmentForTeaserBlock = (
    index: number,
    numColumns: number
  ): FlexAlignment => {
    const columnIndex = index % numColumns;
    const rowIndex = Math.floor(index / numColumns);
  
    return {
      i: index.toString(),
      static: false,
      h: 1,
      w: 12 / numColumns,
      x: (12 / numColumns) * columnIndex,
      y: rowIndex,
    };
  };
  */

  const alignmentForTeaserBlock = (index: number): FlexAlignment => {
    const alignment = {
      i: '',
      static: false,
      h: 0,
      w: 0,
      x: 0,
      y: 0,
    };
    switch (index) {
      case 0:
        return { ...alignment, i: '0', h: 2, w: 1, x: 0, y: 0 };
      case 6:
        return alignment;
      default:
        return alignment;
    }
  };

  return (
    <TeaserSlotsArchiveTopicWrapper className={className}>
      <TeaserSlotsArchiveTopicTeasers>
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
      </TeaserSlotsArchiveTopicTeasers>
    </TeaserSlotsArchiveTopicWrapper>
  );
};
