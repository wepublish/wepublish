import styled from '@emotion/styled';
import { css } from '@mui/material';
import { hasBlockStyle, isBreakBlock } from '@wepublish/block-content/website';
import { BlockContent, BreakBlock } from '@wepublish/website/api';
import {
  BuilderBreakBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';

export const IsSidebarContent = (block: BlockContent): block is BreakBlock =>
  allPass([hasBlockStyle('Sidebar Content'), isBreakBlock])(block);

function randomRGBA() {
  const o = Math.round,
    r = Math.random,
    s = 255;
  return (
    'rgba(' +
    o(r() * s) +
    ',' +
    o(r() * s) +
    ',' +
    o(r() * s) +
    ',' +
    r().toFixed(1) +
    ')'
  );
}
export const SidebarContentWrapper = styled('div')`
  /*
  grid-column: 2 / 3 !important;
  background-color: aqua;
  border-radius: 1cqw;
  height: 300px;
  width: 100%;
  position: sticky;
  top: 0;
  margin-bottom: -100%;
  */

  grid-column: 2 / 3 !important;
  width: 100%;
  position: relative;

  z-index: 6;

  & > span {
    display: block;
    background-color: cyan;
    border-radius: 1cqw;
    height: 300px;
    width: 100%;
    position: sticky;
    top: calc(var(--navbar-height, 0px) + 10px);
    padding: 1cqw;
  }
`;

const siblingSidebarContentWrapperStyles = css`
  & ~ ${SidebarContentWrapper} {
    z-index: 5;
  }
`;

export const SidebarContent = ({
  blockStyle,
  className,
  index,
  count,
}: Pick<BuilderBreakBlockProps, 'blockStyle' | 'className'> & {
  index: number;
  count: number;
}) => {
  const {
    elements: { H2 },
  } = useWebsiteBuilder();

  const s = css`
    ${siblingSidebarContentWrapperStyles};
    grid-row-start: ${1};
    grid-row-end: ${index + 2};
    background-color: white;

    & > span {
      background-color: ${randomRGBA()};
    }
  `;

  return (
    <SidebarContentWrapper css={s}>
      <span>Sidebar Content Block {index}</span>
    </SidebarContentWrapper>
  );
};
