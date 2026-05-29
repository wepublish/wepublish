import { css } from '@emotion/react';
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

import { buttonLinkSecondaryStyles } from '../../theme';
import { ReflektBlockStyles } from '../block-styles/reflekt-block-styles';

export const isImageWithTextBreakBlock = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderBreakBlockProps =>
  allPass([isBreakBlock, hasBlockStyle(ReflektBlockStyles.ImageWithText)])(
    block
  );

export const ImageWithTextBreakBlock = styled(BreakBlock)`
  background-color: ${({ theme }) => theme.palette.secondary.light};
  color: ${({ theme }) => theme.palette.common.black};

  ${BreakBlockButton} {
    ${css(buttonLinkSecondaryStyles)}
  }

  ${({ theme }) => theme.breakpoints.down('md')} {
    ${BreakBlockButton} {
      justify-self: center;
    }
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: 5fr 2fr;
    padding: 2rem 1rem;
    column-gap: 3rem;
    row-gap: 0;
  }
`;
