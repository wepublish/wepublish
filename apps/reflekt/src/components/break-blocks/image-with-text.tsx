import styled from '@emotion/styled';
import {
  BreakBlock,
  BreakBlockButton,
  hasBlockStyle,
  isBreakBlock,
} from '@wepublish/block-content/website';
import { BlockContent } from '@wepublish/website/api';
import { BuilderBreakBlockProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { ReflektBlockType } from '../block-styles/reflekt-block-styles';

export const isImageWithTextBreakBlock = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderBreakBlockProps =>
  allPass([isBreakBlock, hasBlockStyle(ReflektBlockType.ImageWithText)])(block);

export const ImageWithTextBreakBlock = styled(BreakBlock)`
  background-color: ${({ theme }) => theme.palette.secondary.light};
  color: ${({ theme }) => theme.palette.common.black};

  ${({ theme }) => theme.breakpoints.up('xs')} {
    ${BreakBlockButton} {
      background-color: ${({ theme }) => theme.palette.common.black};
      color: ${({ theme }) => theme.palette.common.white};
      text-transform: uppercase;

      &:hover {
        background-color: ${({ theme }) => theme.palette.common.black};
        color: ${({ theme }) => theme.palette.common.white};
      }
    }
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: 5fr 2fr;
    padding: 2rem 1rem;
    column-gap: 3rem;
    row-gap: 0;
  }
`;
