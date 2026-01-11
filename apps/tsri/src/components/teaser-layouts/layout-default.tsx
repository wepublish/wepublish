import styled from '@emotion/styled';
import { BuilderTeaserGridFlexBlockProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriLayoutType } from './tsri-layout';
import {
  alignmentForTeaserBlock as alignmentFunc,
  TeaserFlexGrid,
  TeaserSlots,
} from './tsri-layout';

export const isTeaserFlexGridDefault = allPass([
  ({ blockStyle }: BuilderTeaserGridFlexBlockProps) => {
    return blockStyle === TsriLayoutType.FullsizeImage;
  },
]);

export const alignmentForTeaserBlock = alignmentFunc;

export const TeaserFlexGridDefault = styled(TeaserFlexGrid)``;

export const TeaserSlotsDefault = styled(TeaserSlots)`
  column-gap: 1.25cqw;
  row-gap: 1.25cqw;
`;
