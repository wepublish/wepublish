import styled from '@emotion/styled';
import { hasBlockStyle, isBreakBlock } from '@wepublish/block-content/website';
import { BlockContent } from '@wepublish/website/api';
import { BuilderBreakBlockProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { ReflektBlockType } from '../block-styles/reflekt-block-styles';
import { TextWithImageBreakBlock } from './text-with-image';

export const isTextWithImageAltColorBreakBlock = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderBreakBlockProps =>
  allPass([
    isBreakBlock,
    hasBlockStyle(ReflektBlockType.TextWithImageAltColor),
  ])(block);

export const TextWithImageAltColorBreakBlock = styled(
  TextWithImageBreakBlock
)<BuilderBreakBlockProps>`
  background-color: ${({ theme }) => theme.palette.secondary.main};
`;
