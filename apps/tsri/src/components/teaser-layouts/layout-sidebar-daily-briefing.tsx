import styled from '@emotion/styled';
import {
  BuilderTeaserGridFlexBlockProps,
  BuilderTeaserSlotsBlockProps,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TeaserTopicMeta } from '../teasers/teaser-topic-meta';
import { TsriTeaserType } from '../teasers/tsri-base-teaser';
import { TeaserPreTitle } from '../teasers/tsri-teaser';
import { TsriLayoutType } from './tsri-layout';
import { TeaserFlexGrid, TeaserSlots } from './tsri-layout';

export const isTeaserFlexGridDailyBriefingSidebar = allPass([
  ({ blockStyle }: BuilderTeaserGridFlexBlockProps) => {
    return blockStyle === TsriLayoutType.DailyBriefing;
  },
]);

export const isTeaserSlotsDailyBriefingSidebar = allPass([
  ({ blockStyle }: BuilderTeaserSlotsBlockProps) => {
    return blockStyle === TsriLayoutType.DailyBriefing;
  },
]);

export const teaserBlockStyleByIndex = (index: number): TsriTeaserType => {
  switch (index) {
    case 0:
      return TsriTeaserType.DailyBriefing;
    default:
      return TsriTeaserType.TopicMeta;
  }
};

export const alignmentForTeaserBlock = (index: number) => {
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
      return { ...alignment };
    case 1:
      return { ...alignment, y: 1 };
    default:
      return { ...alignment }; // should never happen
  }
};

export const TeaserFlexGridDailyBriefingSidebar = styled(TeaserFlexGrid)``;

export const TeaserSlotsDailyBriefingSidebar = styled(TeaserSlots)`
  grid-template-columns: 1fr;
  grid-template-rows: min-content auto;
  row-gap: 2cqw;
  height: 100%;

  ${TeaserTopicMeta} {
    ${TeaserPreTitle} {
      width: 100%;
      flex-direction: row;
      text-align: left;
      align-items: center;
      justify-self: center;

      & .MuiLink-root {
        display: block;
        padding: 0.5cqw 1cqw;
        border-radius: 1cqw;
        font-weight: 700 !important;
        background-color: black;
        color: white;
        flex-grow: 1;
        text-decoration: none;

        &:hover {
          background-color: #f5ff64;
          color: black;
        }
      }
    }
  }
`;
