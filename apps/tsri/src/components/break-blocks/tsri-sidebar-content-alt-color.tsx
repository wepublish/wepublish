import styled from '@emotion/styled';
import { hasBlockStyle, isBreakBlock } from '@wepublish/block-content/website';
import { allPass } from 'ramda';

import { TsriBreakBlockType } from './tsri-base-break-block';
import {
  SidebarContentBox,
  SidebarContentButton,
  TsriSidebarContent,
} from './tsri-sidebar-content';

export const isTsriSidebarContentAltColor = (
  block: Pick<BlockContent, '__typename'>
): block is BreakBlock => {
  const retVal = allPass([
    hasBlockStyle(TsriBreakBlockType.SidebarContentAltColor),
    isBreakBlock,
  ])(block);
  return retVal;
};

export const TsriSidebarContentAltColor = styled(TsriSidebarContent)`
  ${SidebarContentBox} {
    background: linear-gradient(
      to bottom,
      ${({ theme }) => theme.palette.primary.main},
      color-mix(
        in srgb,
        ${({ theme }) => theme.palette.common.white} 60%,
        ${({ theme }) => theme.palette.primary.main}
      )
    );
  }
  ${SidebarContentButton} {
    background-color: ${({ theme }) => theme.palette.common.black};
    color: ${({ theme }) => theme.palette.common.white};

    &:hover {
      background-color: ${({ theme }) => theme.palette.primary.light};
      color: ${({ theme }) => theme.palette.common.black};
    }
  }
`;
