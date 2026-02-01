import styled from '@emotion/styled';
import { Theme } from '@mui/material';
import { hasBlockStyle, isFlexBlock } from '@wepublish/block-content/website';
import { BlockContent, FlexBlock } from '@wepublish/website/api';
import { allPass } from 'ramda';

import { TabbedContent, TabPanel } from '../tabbed-content/tabbed-content';
import { TsriLayoutType } from '../teaser-layouts/tsri-layout';
import { TsriTabbedContentType } from './tsri-base-tabbed-content';

export const isTabbedMainContent = (
  block: Pick<BlockContent, '__typename'>
): block is FlexBlock =>
  allPass([
    hasBlockStyle(TsriTabbedContentType.TabbedMainContent),
    isFlexBlock,
  ])(block);

export const blockStyleByIndex = (index: number): TsriLayoutType => {
  switch (index) {
    case 1:
      return TsriLayoutType.ArchiveTopicWithTwoCol;
    case 5:
      return TsriLayoutType.ArchiveTopicAuthor;
    default:
      return TsriLayoutType.ArchiveTopic;
  }
};

export const cssByBlockStyle = (
  index: number,
  theme: Theme,
  blockStyleOverride?: string | undefined | null
): string => {
  let blockStyle = blockStyleByIndex(index);
  if (blockStyleOverride) {
    blockStyle = blockStyleOverride as TsriLayoutType;
  }
  switch (blockStyle) {
    case TsriLayoutType.ArchiveTopicAuthor:
      return `
        &:is([role='tabpanel']) {
          background: linear-gradient(
            to bottom,
            ${theme.palette.primary.main} 0%,
            color-mix(in srgb, ${theme.palette.common.white} 60%, ${theme.palette.primary.main})
          );
        }
        &:is(.MuiTab-root.Mui-selected,.MuiTab-root.Mui-selected:last-of-type,.MuiTab-root.Mui-selected:last-of-type:hover) {
          background-color: ${theme.palette.primary.main};
        }
      `;
    case TsriLayoutType.ArchiveTopic:
    case TsriLayoutType.ArchiveTopicWithTwoCol:
    default:
      return ``;
  }
};

export const TabbedMainContent = styled(TabbedContent)`
  ${TabPanel} {
    position: relative;
    top: -1px;
    z-index: 0;
    padding: 1.7cqw 2cqw 0.5cqw 2cqw;
    border-bottom-right-radius: 8px;
    border-bottom-left-radius: 8px;

    ${({ theme }) => theme.breakpoints.up('md')} {
      padding: 7cqw 1.3cqw 0.5cqw 5.58cqw;
      border-bottom-right-radius: 0;
      border-bottom-left-radius: 0;
    }
  }
`;
