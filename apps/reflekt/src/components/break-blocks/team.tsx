import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
  BreakBlock,
  BreakBlockButton,
  BreakBlockImage,
  BreakBlockSegment,
  hasBlockStyle,
  isBreakBlock,
  RichTextBlockWrapper,
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

export const isTeamBreakBlock = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderBreakBlockProps =>
  allPass([isBreakBlock, hasBlockStyle(ReflektBlockStyles.Team)])(block);

const StyledTeamBreakBlock = styled(BreakBlock)`
  background-color: transparent;
  color: ${({ theme }) => theme.palette.common.black};

  ${BreakBlockImage} {
    width: 100%;
    height: auto;
    max-height: 100%;
    max-width: 100%;
  }

  ${BreakBlockSegment} + ${BreakBlockSegment} {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  ${RichTextBlockWrapper} {
    max-width: 65%;
  }

  ${({ theme }) => theme.breakpoints.up('xs')} {
    grid-template-columns: unset;
    grid-template-rows: repeat(2, auto);
    padding: 4rem 0;
    column-gap: 0;
    row-gap: 2rem;

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
  }
`;

export const TeamBreakBlock = (props: BuilderBreakBlockProps) => (
  <WebsiteBuilderProvider elements={{ Button: ReflektBreakBlockButton }}>
    <StyledTeamBreakBlock {...props} />
  </WebsiteBuilderProvider>
);
