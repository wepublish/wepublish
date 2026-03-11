import styled from '@emotion/styled';
import {
  BlockWithAlignment,
  FlexBlock,
} from '@wepublish/block-content/website';

import { TeaserSlotsXLFullsizeImage } from '../teaser-layouts/layout-xl-fullsize-image-teasers';

export const FlexBlockSmallRowGaps = styled(FlexBlock)`
  row-gap: 4cqw;

  ${({ theme }) => theme.breakpoints.up('md')} {
    row-gap: 1.25cqw;
  }

  ${({ theme }) => theme.breakpoints.up('xs')} {
    ${BlockWithAlignment} {
      &:has(${TeaserSlotsXLFullsizeImage}) {
        grid-column-start: unset;
        grid-column-end: unset;
        grid-column: -1 / 1;
      }
    }
  }
`;
