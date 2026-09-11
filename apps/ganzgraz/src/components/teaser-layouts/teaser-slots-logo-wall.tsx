import styled from '@emotion/styled';
import { hasBlockStyle } from '@wepublish/block-content/website';
import { createWithInheritedTheme } from '@wepublish/ui';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TeaserSlotsTheme } from '../../theme';
import { GanzGrazBlockStyles } from '../block-styles/ganzgraz-block-styles';
import {
  GanzGrazTeaserSlots,
  TeaserSlotsTeasers,
} from './ganzgraz-teaser-slots';

export const isTeaserSlotsLogoWall = allPass([
  ({ blockStyle }: BuilderTeaserSlotsBlockProps) =>
    hasBlockStyle(GanzGrazBlockStyles.LogoWall)({ blockStyle }),
]);

export const StyledTeaserSlotsLogoWall = styled(GanzGrazTeaserSlots)`
  column-gap: ${({ theme }) => theme.spacing(6)};
  row-gap: ${({ theme }) => theme.spacing(3)};
  grid-template-rows: repeat(2, auto);

  ${({ theme }) => theme.breakpoints.up('xs')} {
    grid-template-columns: unset;
  }

  ${TeaserSlotsTeasers} {
    grid-template-rows: auto;
    grid-template-columns: repeat(2, 1fr);

    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    }
  }
`;

export const TeaserSlotsLogoWall = createWithInheritedTheme(
  StyledTeaserSlotsLogoWall,
  TeaserSlotsTheme
);
