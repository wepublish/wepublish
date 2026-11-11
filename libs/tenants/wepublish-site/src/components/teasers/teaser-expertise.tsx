import styled from '@emotion/styled';
import { hasBlockStyle } from '@wepublish/block-content/website';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { WepBlockStyles } from '../block-styles/wep-block-styles';
import {
  TeaserAuthors,
  TeaserContentWrapper,
  TeaserImageWrapper,
  TeaserLead,
  TeaserMetadata,
  TeaserPreTitle,
  TeaserPreTitleWrapper,
  TeaserTime,
  TeaserTitle,
  WepTeaser,
} from './wep-teaser';

export const isTeaserExpertise = allPass([
  ({ blockStyle }: BuilderTeaserProps) =>
    hasBlockStyle(WepBlockStyles.TeaserExpertise)({ blockStyle }),
]);

export const TeaserExpertise = styled(WepTeaser)`
  aspect-ratio: unset;
  grid-template-rows: minmax(auto, 300px) repeat(3, auto);
  grid-template-columns: 1fr;

  background-color: ${({ theme }) => theme.palette.primary.light};
  padding: ${({ theme }) => theme.spacing(0, 4, 3, 4)};
  row-gap: ${({ theme }) => theme.spacing(6)};

  ${TeaserContentWrapper} {
    display: contents;
  }

  ${TeaserImageWrapper} {
    grid-row: 1 / 2;
    margin: ${({ theme }) => theme.spacing(0, -4, 0, -4)};
  }

  ${TeaserTitle} {
    grid-row: 2 / 3;
  }

  ${TeaserLead} {
    grid-row: 3 / 4;
    margin-top: ${({ theme }) => theme.spacing(-3.5)};
  }

  ${TeaserPreTitleWrapper} {
    grid-row: 4 / 5;
    align-self: end;
  }

  ${TeaserPreTitle} {
  }

  ${TeaserMetadata} {
    display: none;
  }

  ${TeaserAuthors} {
    display: none;
  }

  ${TeaserTime} {
    display: none;
  }
`;
