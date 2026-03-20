import styled from '@emotion/styled';
import { BuilderBreakBlockProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { ReflektBlockType } from '../block-styles/reflekt-block-styles';
import { ImageWithTextBreakBlock } from './image-with-text';

export const isImageWithTextAltColorBreakBlock = allPass([
  ({ blockStyle }: BuilderBreakBlockProps) => {
    return blockStyle === ReflektBlockType.ImageWithTextAltColor;
  },
]);

export const ImageWithTextAltColorBreakBlock = styled(
  ImageWithTextBreakBlock
)<BuilderBreakBlockProps>`
  background-color: ${({ theme }) => theme.palette.secondary.main};
`;
