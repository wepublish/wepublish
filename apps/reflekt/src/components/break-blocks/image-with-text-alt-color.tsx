import styled from '@emotion/styled';
import { hasBlockStyle, isBreakBlock } from '@wepublish/block-content/website';
import { BlockContent } from '@wepublish/website/api';
import { BuilderBreakBlockProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { ReflektBlockStyles } from '../block-styles/reflekt-block-styles';
import { ImageWithTextBreakBlock } from './image-with-text';

export const isImageWithTextAltColorBreakBlock = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderBreakBlockProps =>
  allPass([
    isBreakBlock,
    hasBlockStyle(ReflektBlockStyles.ImageWithTextAltColor),
  ])(block);

export const ImageWithTextAltColorBreakBlock = styled(
  ImageWithTextBreakBlock
)<BuilderBreakBlockProps>`
  background-color: ${({ theme }) => theme.palette.secondary.main};
`;
