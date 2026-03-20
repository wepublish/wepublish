import styled from '@emotion/styled';
import { BuilderBreakBlockProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { ReflektBlockType } from '../block-styles/reflekt-block-styles';
import { TextWithImageBreakBlock } from './text-with-image';

export const isTextWithImageAltColorBreakBlock = allPass([
  ({ blockStyle }: BuilderBreakBlockProps) => {
    return blockStyle === ReflektBlockType.TextWithImageAltColor;
  },
]);

export const TextWithImageAltColorBreakBlock = styled(
  TextWithImageBreakBlock
)<BuilderBreakBlockProps>`
  background-color: ${({ theme }) => theme.palette.secondary.main};
`;
