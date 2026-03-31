import styled from '@emotion/styled';
import { hasBlockStyle } from '@wepublish/block-content/website';
import { createWithTheme } from '@wepublish/ui';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { teaserNews } from '../../theme';
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

export const isTeaserNews = allPass([
  ({ blockStyle }: BuilderTeaserProps) =>
    hasBlockStyle(WepBlockStyles.TeaserNews)({ blockStyle }),
]);

const WepTeaserStyled = styled(WepTeaser)`
  aspect-ratio: unset;
  grid-template-rows: minmax(auto, 220px) repeat(2, auto);
  grid-template-columns: 1fr;
  cursor: default;
  background-color: transparent;
  padding: ${({ theme }) => theme.spacing(0)};
  row-gap: ${({ theme }) => theme.spacing(1.5)};

  ${TeaserContentWrapper} {
    display: contents;
  }

  ${TeaserImageWrapper} {
    grid-row: 1 / 2;
  }

  ${TeaserTitle} {
    grid-row: 2 / 3;
    font-size:;
  }

  ${TeaserLead} {
    display: none;
  }

  ${TeaserPreTitleWrapper} {
    display: none;
  }

  ${TeaserPreTitle} {
    display: none;
  }

  ${TeaserMetadata} {
    display: block;
    align-self: end;
  }

  ${TeaserAuthors} {
    display: contents;
  }

  ${TeaserTime} {
    display: contents;
  }
`;

export const TeaserNews = createWithTheme(WepTeaserStyled, teaserNews);
