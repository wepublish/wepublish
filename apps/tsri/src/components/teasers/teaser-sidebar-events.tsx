import styled from '@emotion/styled';
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
  TeaserPreTitleWrapper,
  TsriTeaser,
} from './tsri-teaser';

export const isTeaserEvents = allPass([
  ({ blockStyle }: BuilderTeaserProps) => {
    return blockStyle === TsriTeaserType.Events;
  },
]);

export const TeaserEventsBase = styled(TsriTeaser)`
  aspect-ratio: unset !important;
  border-radius: 0 !important;
  container: unset;

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
