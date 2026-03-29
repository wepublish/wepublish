import styled from '@emotion/styled';
import {
  BreakBlock,
  BreakBlockButton,
  BreakBlockImage,
  BreakBlockSegment,
  hasBlockStyle,
  isBreakBlock,
} from '@wepublish/block-content/website';
import {
  BlockContent,
  BreakBlock as BreakBlockType,
} from '@wepublish/website/api';
import { allPass } from 'ramda';

import { WepBlockStyles } from '../block-styles/wep-block-styles';

export const isAttentionCatcher = (
  block: Pick<BlockContent, '__typename'>
): block is BreakBlockType =>
  allPass([hasBlockStyle(WepBlockStyles.AttentionCatcher), isBreakBlock])(
    block
  );

export const AttentionCatcher = styled(BreakBlock)`
  background-color: ${({ theme }) => theme.palette.primary.main};

  ${({ theme }) => theme.breakpoints.up('xs')} {
    padding: ${({ theme }) => theme.spacing(8)};
    grid-template-columns: 1fr;
    gap: 0;
  }

  ${BreakBlockSegment} {
    background-color: transparent;
  }

  ${BreakBlockImage} {
    display: none;
  }

  ${BreakBlockButton} {
    background-color: ${({ theme }) => theme.palette.common.black};
    color: ${({ theme }) => theme.palette.common.white};
    border-radius: 3px;
    font-weight: 400;
    transition: none;

    &:hover {
      background-color: ${({ theme }) => theme.palette.common.black};
      color: ${({ theme }) => theme.palette.common.white};
      font-weight: 500;
      box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.4);
    }
  }
`;
