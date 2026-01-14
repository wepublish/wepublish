import styled from '@emotion/styled';
import {
  Tab,
  TabbedContent as TabbedContentDefault,
  TabPanel,
  Tabs,
} from '@wepublish/block-content/website';
import { BlockType } from '@wepublish/website/api';
import { BuilderBlockStyleProps } from '@wepublish/website/builder';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriBaseTeaserSlots as HeroTeaserDefault } from '../teaser-layouts/tsri-base-teaser-slots';
import { TsriLayoutType } from '../teaser-layouts/tsri-layout';
import { TeaserPreTitle } from '../teasers/tsri-teaser';
import { TsriTabbedContentType } from './tsri-base-tabbed-content';

export const isHeroTeaserWithTabbedSidebarContent = ({
  blockStyle,
}: BuilderBlockStyleProps['TabbedContent']) => {
  return allPass([
    ({ blockStyle }: BuilderBlockStyleProps['TabbedContent']) => {
      return (
        blockStyle === TsriTabbedContentType.HeroTeaserWithTabbedSidebarContent
      );
    },
  ])({ blockStyle } as BuilderBlockStyleProps['TabbedContent']);
};

// defaults for this layout. can be overridden in the editor...
export const blockStyleByIndex = (index: number): TsriLayoutType => {
  switch (index) {
    case 0:
      return TsriLayoutType.HeroTeaser;
    case 1:
      return TsriLayoutType.DailyBriefing;
    case 2:
      return TsriLayoutType.FocusMonth;
    case 3:
      return TsriLayoutType.ShopProducts;
    default:
      return TsriLayoutType.DailyBriefing; // should never happen
  }
};

const cssByBlockStyle = (
  index: number,
  blockStyleOverride?: string | undefined | null
): string => {
  let blockStyle = blockStyleByIndex(index);
  if (blockStyleOverride) {
    blockStyle = blockStyleOverride as TsriLayoutType;
  }
  switch (blockStyle) {
    case TsriLayoutType.DailyBriefing:
      return `
        &:is([role='tabpanel']) {
          background: linear-gradient(
            to bottom,
            rgb(12, 159, 237),
            color-mix(in srgb, white 40%, rgb(12, 159, 237))
          );
        }
        &:is(.MuiTab-root.Mui-selected,.MuiTab-root.Mui-selected:last-of-type,.MuiTab-root.Mui-selected:last-of-type:hover) {
          background-color: rgb(12, 159, 237);
        }
      `;
    case TsriLayoutType.FocusMonth:
    case TsriLayoutType.ShopProducts:
      return `
        &:is([role='tabpanel']) {
          background: linear-gradient(
            to bottom,
            #f5ff64,
            color-mix(in srgb, white 40%, #f5ff64)
          );
        }
        &:is(.MuiTab-root.Mui-selected,.MuiTab-root.Mui-selected:last-of-type,.MuiTab-root.Mui-selected:last-of-type:hover) {
          background-color: #f5ff64;
          color: black;
        }
      `;
    case TsriLayoutType.TsriLove:
    default:
      return `
        &:is([role='tabpanel']) {
          background: linear-gradient(
            to bottom,
            rgb(174, 179, 190),
            color-mix(in srgb, white 40%, rgb(174, 179, 190))
          );
        }
        &:is(.MuiTab-root.Mui-selected,.MuiTab-root.Mui-selected:last-of-type,.MuiTab-root.Mui-selected:last-of-type:hover) {
          background-color: rgb(174, 179, 190);
        }
      `;
  }
};

export const FrontTopRow = styled('div')`
  display: grid;
  align-items: stretch;
  list-style: none;
  margin: 0;
  padding: 0;
  row-gap: 2cqw;
  grid-template-columns: unset;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: repeat(12, 1fr);
    column-gap: 1cqw;
    row-gap: 0;
  }
`;

export const HeroTeaser = styled(HeroTeaserDefault)`
  grid-column: unset;
  grid-row: unset;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-row: 1 / 2;
    grid-column: 1 / 9;
  }
`;

export const SidebarContent = styled(TabbedContentDefault)`
  display: grid;
  grid-template-rows: min-content 1fr;
  grid-column: unset;
  grid-row: unset;
  container: unset;
  --sizing-factor: 2.9;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-row: 1 / 2;
    grid-column: 9 / 13;
    --sizing-factor: 1;
  }

  ${TabPanel} {
    position: relative;
    top: -1px;
    z-index: 0;
    padding: calc(var(--sizing-factor) * 1.5cqw) 0
      calc(var(--sizing-factor) * 1.5cqw) calc(var(--sizing-factor) * 6cqw);
    border-bottom-left-radius: 2cqw;
    border-bottom-right-radius: 2cqw;

    ${TeaserPreTitle} {
      margin-top: 5cqw;

      ${({ theme }) => theme.breakpoints.up('md')} {
        margin-top: 0;
      }
    }

    ${({ theme }) => theme.breakpoints.up('md')} {
      border-bottom-left-radius: 1cqw;
      border-bottom-right-radius: 1cqw;
    }
  }

  ${Tabs} {
    background-color: transparent;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    padding: 0;
    align-items: stretch;

    & .MuiTabs-fixed {
      overflow: hidden !important;
    }

    & .MuiTabs-flexContainer {
      flex-wrap: nowrap !important;
      gap: 0 !important;
    }
  }

  ${Tab} {
    font-size: calc(var(--sizing-factor) * 1.2cqw) !important;
    line-height: calc(var(--sizing-factor) * 1.2cqw) !important;
    font-weight: 700 !important;
    padding-left: calc(var(--sizing-factor) * 1cqw) !important;
    margin-right: calc(var(--sizing-factor) * 0.25cqw) !important;
    color: white;
    background-color: black;
    border-top-left-radius: 2cqw;
    border-top-right-radius: 2cqw;

    &:hover {
      background-color: #f5ff64;
      color: black;
    }

    &:last-of-type {
      margin-right: 0 !important;
    }

    &.Mui-selected:last-of-type,
    &.Mui-selected:last-of-type:hover {
      color: white;
    }

    ${({ theme }) => theme.breakpoints.up('md')} {
      border-top-left-radius: 1cqw;
      border-top-right-radius: 1cqw;
    }
  }
`;

export const HeroTeaserWithTabbedContent = ({
  className,
  blocks,
  blockStyle,
  blockStyleByIndex,
}: BuilderBlockStyleProps['TabbedContent'] & {
  blockStyleByIndex: (index: number) => TsriLayoutType;
}) => {
  return (
    <FrontTopRow>
      <HeroTeaser
        {...(blocks[0].block as BuilderTeaserSlotsBlockProps)}
        blockStyle={TsriLayoutType.HeroTeaser}
      />
      <SidebarContent
        className={className}
        blocks={blocks.slice(1)}
        blockStyle={blockStyle}
        blockStyleByIndex={(index: number) => blockStyleByIndex(index + 1)}
        cssByBlockStyle={(
          index: number,
          blockStyleOverride?: string | undefined | null
        ) => cssByBlockStyle(index + 1, blockStyleOverride)}
        type={BlockType.FlexBlock}
      />
    </FrontTopRow>
  );
};
