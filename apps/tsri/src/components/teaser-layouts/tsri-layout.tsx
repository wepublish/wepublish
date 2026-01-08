import styled from '@emotion/styled';
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

export enum TsriLayoutType {
  // basic teaser layouts
  FullsizeImage = 'FullsizeImage',
  NoImage = 'NoImage',
  NoImageAltColor = 'NoImageAltColor',
  TwoCol = 'TwoCol',
  TwoColAltColor = 'TwoColAltColor',
  XLFullsizeImage = 'XLFullsizeImage',

  // archive layouts
  ArchiveTopic = 'ArchiveTopic',
  ArchiveTopicWithTwoCol = 'ArchiveTopicWithTwoCol',
  ArchiveTopicAuthor = 'ArchiveTopicAuthor',

  // sidebar layouts
  DailyBriefing = 'DailyBriefing',
  ShopProducts = 'ShopProducts',
  FocusMonth = 'FocusMonth',
  TsriLove = 'TsriLove',

  // hero teaser layouts
  HeroTeaser = 'HeroTeaser',
}

export const TeaserLayoutWrapper = styled('ul')`
  display: grid;
  align-items: stretch;
  list-style: none;
  margin: 0;
  padding: 0;
  grid-template-columns: repeat(12, 1fr);
`;

export const alignmentForTeaserBlock = (
  index: number,
  count?: number
): FlexAlignment => {
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
  teaserBlockStyleByIndex,
  blockStyle,
}: BuilderTeaserGridFlexBlockProps & {
  alignmentForTeaserBlock: (index: number, count?: number) => FlexAlignment;
  teaserBlockStyleByIndex?: (index: number, count?: number) => string;
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
          alignment={alignmentForTeaserBlock(index, sortedTeasers.length)}
          blockStyle={
            (teaserBlockStyleByIndex &&
              teaserBlockStyleByIndex(index, sortedTeasers.length)) ||
            blockStyle
          }
        />
      ))}
    </TeaserLayoutWrapper>
  );
};

export const TeaserSlots = ({
  teasers,
  className,
  alignmentForTeaserBlock,
  teaserBlockStyleByIndex,
  blockStyle,
}: BuilderTeaserSlotsBlockProps & {
  alignmentForTeaserBlock: (index: number, count?: number) => FlexAlignment;
  teaserBlockStyleByIndex?: (index: number, count?: number) => string;
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
          alignment={alignmentForTeaserBlock(index, filledTeasers.length)}
          blockStyle={
            (teaserBlockStyleByIndex &&
              teaserBlockStyleByIndex(index, filledTeasers.length)) ||
            blockStyle
          }
        />
      ))}
    </TeaserLayoutWrapper>
  );
};
