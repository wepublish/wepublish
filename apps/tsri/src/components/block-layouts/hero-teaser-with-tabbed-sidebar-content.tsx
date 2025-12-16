import styled from '@emotion/styled';
import {
  Tab,
  TabbedContent as TabbedContentDefault,
  TabPanel,
} from '@wepublish/block-content/website';
import { BlockType } from '@wepublish/website/api';
import { BuilderBlockStyleProps } from '@wepublish/website/builder';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriBaseTeaserSlots as HeroTeaserDefault } from '../teaser-layouts/tsri-base-teaser-slots';
import { TsriLayoutType } from '../teaser-layouts/tsri-layout';
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
  grid-template-columns: repeat(12, 1fr);
  column-gap: 1cqw;
  row-gap: 0;
`;

export const HeroTeaser = styled(HeroTeaserDefault)`
  grid-column: 1 / 9;
  grid-row: 1 / 2;
`;

export const SidebarContent = styled(TabbedContentDefault)`
  display: grid;
  grid-template-rows: min-content 1fr;
  grid-column: 9 / 13;
  grid-row: 1 / 2;
  container: unset;

  ${TabPanel} {
    position: relative;
    top: -1px;
    z-index: 0;
    padding: 1.5cqw 0 1.5cqw 6cqw;
    border-bottom-left-radius: 1cqw;
    border-bottom-right-radius: 1cqw;
  }

  ${Tab} {
    font-size: 1.2cqw !important;
    line-height: 1.2cqw !important;
    font-weight: 700 !important;
    padding-left: 1cqw !important;
    color: white;
    background-color: black;

    &:hover {
      background-color: #f5ff64;
      color: black;
    }

    &.Mui-selected:last-of-type,
    &.Mui-selected:last-of-type:hover {
      color: white;
    }
  }
`;

export const HeroTeaserWithTabbedContent = ({
  className,
  nestedBlocks,
  blockStyle,
  blockStyleByIndex,
}: BuilderBlockStyleProps['TabbedContent'] & {
  blockStyleByIndex: (index: number) => TsriLayoutType;
}) => {
  return (
    <FrontTopRow>
      <HeroTeaser
        {...(nestedBlocks[0].block as BuilderTeaserSlotsBlockProps)}
        blockStyle={TsriLayoutType.HeroTeaser}
      />
      <SidebarContent
        className={className}
        nestedBlocks={nestedBlocks.slice(1)}
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
