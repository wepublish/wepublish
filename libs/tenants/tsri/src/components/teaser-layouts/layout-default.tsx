import styled from '@emotion/styled';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriLayoutType } from './tsri-layout';
import {
  alignmentForTeaserBlock as alignmentFunc,
  TeaserSlots,
} from './tsri-layout';

export const isTeaserSlotsDefault = allPass([
  ({ blockStyle }: BuilderTeaserSlotsBlockProps) => {
    return blockStyle === TsriLayoutType.FullsizeImage;
  },
]);

export const alignmentForTeaserBlock = alignmentFunc;

export const TeaserSlotsDefault = styled(TeaserSlots)`
  column-gap: 1.25cqw;
  row-gap: 4cqw;

  ${({ theme }) => theme.breakpoints.up('md')} {
    row-gap: 1.25cqw;
  }
`;
