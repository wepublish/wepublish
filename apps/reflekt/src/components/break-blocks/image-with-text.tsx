import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
  BreakBlock,
  BreakBlockButton,
  hasBlockStyle,
  isBreakBlock,
} from '@wepublish/block-content/website';
import { BlockContent } from '@wepublish/website/api';
import {
  BuilderBreakBlockProps,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { buttonLinkSecondaryStyles } from '../../theme';
import { ReflektBlockStyles } from '../block-styles/reflekt-block-styles';
import { ReflektBreakBlockButton } from './reflekt-break-block-button';

export const isImageWithTextBreakBlock = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderBreakBlockProps =>
  allPass([isBreakBlock, hasBlockStyle(ReflektBlockStyles.ImageWithText)])(
    block
  );

const StyledImageWithTextBreakBlock = styled(BreakBlock)`
  background-color: ${({ theme }) => theme.palette.secondary.light};
  color: ${({ theme }) => theme.palette.common.black};

  ${BreakBlockButton} {
    ${css(buttonLinkSecondaryStyles)}

    & .MuiTouchRipple-root {
      display: none;
    }

    &&,
    &&:hover,
    &&:focus,
    &&:focus-visible,
    &&:visited {
      background-color: ${({ theme }) => theme.palette.common.black};
      color: ${({ theme }) => theme.palette.common.white};
      outline: none;
    }

    &&.is-pressing,
    &&:active {
      background-color: ${({ theme }) => theme.palette.common.black};
      color: ${({ theme }) => theme.palette.common.white};
      box-shadow: 0 -12px 0 0 ${({ theme }) => theme.palette.secondary.light};
      transform: translateY(12px);
    }
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

export const ImageWithTextBreakBlock = (props: BuilderBreakBlockProps) => (
  <WebsiteBuilderProvider elements={{ Button: ReflektBreakBlockButton }}>
    <StyledImageWithTextBreakBlock {...props} />
  </WebsiteBuilderProvider>
);
