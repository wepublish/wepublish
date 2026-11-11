import styled from '@emotion/styled';
import { hasBlockStyle } from '@wepublish/block-content/website';
import { createWithTheme } from '@wepublish/ui';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { sidebarEventsTheme } from '../../theme';
import { TsriTeaserType } from './tsri-base-teaser';
import {
  TeaserAuthorImageWrapper,
  TeaserContentWrapper,
  TeaserImageWrapper,
  TeaserMetadata,
  TeaserPreTitleNoContent,
  TeaserPreTitleWrapper,
  TeaserTitle,
  TsriTeaser,
} from './tsri-teaser';

export const isTeaserEvents = allPass([
  ({ blockStyle }: BuilderTeaserProps) =>
    hasBlockStyle(TsriTeaserType.Events)({ blockStyle }),
]);

export const TeaserEventsBase = styled(TsriTeaser)`
  aspect-ratio: unset !important;
  border-radius: 0 !important;
  container: unset;

  ${TeaserTitle} {
    & > .MuiTypography-root {
      padding: 1.5cqw;

      ${({ theme }) => theme.breakpoints.up('md')} {
        padding: 0.5cqw;
      }
    }
  }

  ${TeaserContentWrapper} {
    display: block;
    background-color: ${({ theme }) => theme.palette.common.white};
  }

  ${TeaserImageWrapper} {
    display: none;
  }

  ${TeaserPreTitleWrapper} {
    display: none;
  }

  ${TeaserPreTitleNoContent} {
    display: none;
  }

  ${TeaserAuthorImageWrapper} {
    display: none;
  }

  ${TeaserMetadata} {
    display: none;
  }
`;

export const StyledTeaserEvents = styled(TeaserEventsBase)``;

export const TeaserEvents = createWithTheme(
  StyledTeaserEvents,
  sidebarEventsTheme
);
