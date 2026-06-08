import styled from '@emotion/styled';
import { hasBlockStyle } from '@wepublish/block-content/website';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { WepBlockStyles } from '../block-styles/wep-block-styles';
import { WepTeaserSlots } from './wep-teaser-slots';

export const isTeaserSlotsServices = allPass([
  ({ blockStyle }: BuilderTeaserSlotsBlockProps) =>
    hasBlockStyle(WepBlockStyles.TeaserServices)({ blockStyle }),
]);

export const TeaserSlotsServices = styled(WepTeaserSlots)`
  column-gap: ${({ theme }) => theme.spacing(2)};
  row-gap: ${({ theme }) => theme.spacing(2)};
  grid-template-rows: auto;
`;
