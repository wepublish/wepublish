import styled from '@emotion/styled';
import {
  TabbedContent as TabbedContentDefault,
  TabPanel,
} from '@wepublish/block-content/website';
import { BuilderBlockStyleProps } from '@wepublish/website/builder';

import { TsriLayoutType } from '../teaser-layouts/tsri-layout';
import { TsriTabbedContentType } from './tsri-base-tabbed-content';
export const isTabbedMainContent = ({
  blockStyle,
}: BuilderBlockStyleProps['TabbedContent']) => {
  return blockStyle === TsriTabbedContentType.TabbedMainContent;
};

export const blockStyleByIndex = (index: number): TsriLayoutType => {
  switch (index) {
    case 5:
      return TsriLayoutType.ArchiveTopicAuthor;
    default:
      return TsriLayoutType.ArchiveTopic;
  }
};

export const cssByBlockStyle = (
  index: number,
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
            rgb(12, 159, 237),
            color-mix(in srgb, white 40%, rgb(12, 159, 237))
          );
        }
        &:is(.MuiTab-root.Mui-selected,.MuiTab-root.Mui-selected:last-of-type,.MuiTab-root.Mui-selected:last-of-type:hover) {
          background-color: rgb(12, 159, 237);
        }
      `;
    case TsriLayoutType.ArchiveTopic:
    case TsriLayoutType.ArchiveTopicWithTwoCol:
    default:
      return ``;
  }
};

export const TabbedMainContent = styled(TabbedContentDefault)`
  ${TabPanel} {
    position: relative;
    top: -1px;
    z-index: 0;
    padding: 7cqw 1.3cqw 0.5cqw 5.58cqw;
`;
