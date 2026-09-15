import { css } from '@emotion/react';
import { Theme } from '@mui/material';
import {
  FlexBlockWrapper,
  ImageBlockCaption,
  ImageBlockImage,
  ImageGalleryBlockWrapper,
  TeaserGridBlockWrapper,
  TeaserGridFlexBlockWrapper,
  TeaserListBlockWrapper,
  TeaserSlotsBlockWrapper,
} from '@wepublish/block-content/website';
import { SubscribeWrapper } from '@wepublish/membership/website';

import { SidebarContentWrapper } from './break-blocks/tsri-sidebar-content';

export const TSRI_TWO_COLUMN_CONTENT_CLASS = 'tsri-two-column-content';

export const twoColumnContentStyles = (theme: Theme) => css`
  min-width: 0;
  grid-template-columns: var(--two-column-grid);
  justify-content: space-between;

  &
    > *:not(
      ${SidebarContentWrapper},
        ${TeaserGridFlexBlockWrapper},
        ${TeaserGridBlockWrapper},
        ${TeaserListBlockWrapper},
        ${TeaserSlotsBlockWrapper},
        ${ImageGalleryBlockWrapper},
        ${SubscribeWrapper},
        ${FlexBlockWrapper}
    ) {
    grid-column: 1 / 2;
  }

  &
    > :is(
      ${TeaserGridFlexBlockWrapper},
        ${TeaserGridBlockWrapper},
        ${TeaserListBlockWrapper},
        ${TeaserSlotsBlockWrapper},
        ${ImageGalleryBlockWrapper},
        ${SubscribeWrapper},
        ${FlexBlockWrapper}
    ) {
    grid-column: -1 / 1;
  }

  ${ImageBlockImage} {
    border-radius: 1rem;
    object-fit: cover;
    object-position: left center;
    max-width: calc(100vw - ${theme.spacing(4)});

    ${theme.breakpoints.up('sm')} {
      max-width: calc(100vw - ${theme.spacing(6)});
    }

    ${theme.breakpoints.up('md')} {
      max-width: 100%;
    }
  }

  ${ImageBlockCaption} {
    font-size: 0.75rem;
    line-height: 1rem;
    font-weight: 700;
  }

  & :is(${SidebarContentWrapper}) + * {
    margin-top: ${theme.spacing(-3)};
  }
`;
