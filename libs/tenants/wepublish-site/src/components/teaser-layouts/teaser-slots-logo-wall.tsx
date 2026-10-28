import styled from '@emotion/styled';
import { hasBlockStyle } from '@wepublish/block-content/website';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { WepBlockStyles } from '../block-styles/wep-block-styles';
import { TeaserSlotsTeasers, WepTeaserSlots } from './wep-teaser-slots';

export const isTeaserSlotsLogoWall = allPass([
  ({ blockStyle }: BuilderTeaserSlotsBlockProps) =>
    hasBlockStyle(WepBlockStyles.LogoWall)({ blockStyle }),
]);

export const TeaserSlotsLogoWall = styled(WepTeaserSlots)`
  column-gap: ${({ theme }) => theme.spacing(6)};
  row-gap: ${({ theme }) => theme.spacing(3)};
  grid-template-rows: repeat(2, auto);

  ${TeaserSlotsTeasers} {
    grid-template-rows: auto;
    grid-template-columns: repeat(2, 1fr);

    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    }
  }
`;
