import styled from '@emotion/styled';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriTeaserType } from '../teasers/tsri-base-teaser';
import { TeaserPreTitle } from '../teasers/tsri-teaser';
import { TeaserSlots, TsriLayoutType } from './tsri-layout';

export const isTeaserSlotsDailyBriefingSidebar = allPass([
  ({ blockStyle }: BuilderTeaserSlotsBlockProps) => {
    return blockStyle === TsriLayoutType.DailyBriefing;
  },
]);

export const teaserBlockStyleByIndex = (
  index: number,
  count?: number
): TsriTeaserType => {
  switch (index) {
    case count! - 1:
      return TsriTeaserType.TopicMeta;
    default:
      return TsriTeaserType.DailyBriefing;
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

export const TeaserSlotsDailyBriefingSidebar = styled(TeaserSlots)`
  grid-template-columns: 1fr !important;
  grid-template-rows: min-content auto;
  row-gap: calc(var(--sizing-factor) * 2cqw);
  height: 100%;

  ${TeaserPreTitle} {
    width: 100%;
    flex-direction: row;
    text-align: left !important;
    align-items: flex-end;
    justify-self: center;

    & .MuiLink-root {
      display: block !important;
      padding: calc(var(--sizing-factor) * 0.5cqw)
        calc(var(--sizing-factor) * 1cqw) !important;
      border-radius: calc(var(--sizing-factor) * 1cqw);
      font-weight: 700 !important;
      background-color: ${({ theme }) => theme.palette.common.black};
      color: ${({ theme }) => theme.palette.common.white};
      flex-grow: 1 !important;
      text-decoration: none !important;

      &:hover {
        background-color: ${({ theme }) => theme.palette.primary.light};
        color: ${({ theme }) => theme.palette.common.black};
      }
    }
  }
`;
