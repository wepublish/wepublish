import styled from '@emotion/styled';
import { BreakBlockSegment } from '@wepublish/block-content/website';
import { BuilderBreakBlockProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { ReflektBlockType } from '../block-styles/reflekt-block-styles';
import { ImageWithTextBreakBlock } from './image-with-text';

export const isTextWithImageBreakBlock = allPass([
  ({ blockStyle }: BuilderBreakBlockProps) => {
    return blockStyle === ReflektBlockType.TextWithImage;
  },
]);

export const TextWithImageBreakBlock = styled(
  ImageWithTextBreakBlock
)<BuilderBreakBlockProps>`
  ${BreakBlockSegment} + ${BreakBlockSegment} {
    ${({ theme }) => theme.breakpoints.up('md')} {
      order: -1;
    }
  }
`;
