import styled from '@emotion/styled';
import {
  Tab,
  TabbedContent as TabbedContentDefault,
  TabPanel,
} from '@wepublish/block-content/website';
import { BuilderBlockStyleProps } from '@wepublish/website/builder';

TabbedContentDefault['subBlockStyles'] = [
  'ArchiveTopic',
  'ArchiveTopicWithTwoCol',
  'XYZ',
  'ArchiveTopic',
  'ArchiveTopic',
  'ArchiveTopicAuthor',
] as BuilderBlockStyleProps['TabbedContent']['subBlockStyles'];

export const TabbedContent = styled(TabbedContentDefault)`
  ${TabPanel} {
    background: linear-gradient(
      to bottom,
      rgb(174, 179, 190),
      rgba(174, 179, 190, 0.4)
    );
    position: relative;
    top: -1px;
    z-index: 0;

    @container tabbed-content (width > 200px) {
      padding: 7cqw 1.3cqw 0.5cqw 5.58cqw;
    }

    &:last-of-type {
      background: linear-gradient(
        to bottom,
        rgb(12, 159, 237),
        color-mix(in srgb, white 40%, rgb(12, 159, 237))
      );
    }
  }

  ${Tab} {
    &.Mui-selected:last-of-type,
    &.Mui-selected:last-of-type:hover {
      background-color: rgb(12, 159, 237);
    }
  }
`;
