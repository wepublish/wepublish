import styled from '@emotion/styled';
import {
  BreakBlockSegment,
  hasBlockStyle,
  isBreakBlock,
} from '@wepublish/block-content/website';
import { BlockContent } from '@wepublish/website/api';
import { BuilderBreakBlockProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { ReflektBlockStyles } from '../block-styles/reflekt-block-styles';
import { ImageWithTextBreakBlock } from './image-with-text';

export const isTextWithImageBreakBlock = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderBreakBlockProps =>
  allPass([isBreakBlock, hasBlockStyle(ReflektBlockStyles.TextWithImage)])(
    block
  );

export const TextWithImageBreakBlock = styled(
  ImageWithTextBreakBlock
)<BuilderBreakBlockProps>`
  ${BreakBlockSegment} + ${BreakBlockSegment} {
    ${({ theme }) => theme.breakpoints.up('md')} {
      order: -1;
    }
  }
`;
