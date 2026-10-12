import styled from '@emotion/styled';
import {
  Blocks,
  BuilderPageProps,
  ContentWrapper,
  PageSEO,
} from '@wepublish/website/builder';

import { BKA_SIDEBAR_BLOCK_STYLES } from '../block-styles/bka-block-styles';

export const BkaPageGrid = styled('div')`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: ${({ theme }) => theme.spacing(5)};

  &[data-with-aside='true'] {
    ${({ theme }) => theme.breakpoints.up('lg')} {
      grid-template-columns: minmax(0, 1fr) 364px;
      column-gap: 126px;
    }
  }
`;

export const BkaPageAside = styled('div')`
  display: grid;
  align-content: start;
  gap: ${({ theme }) => theme.spacing(1.5)};

  ${({ theme }) => theme.breakpoints.up('lg')} {
    gap: ${({ theme }) => theme.spacing(3.5)};
  }
`;

const isSidebarBlock = (block: { blockStyle?: string | null }) =>
  !!block.blockStyle && BKA_SIDEBAR_BLOCK_STYLES.includes(block.blockStyle);

export const BkaPage = ({
  className,
  data,
  loading,
  children,
}: BuilderPageProps) => {
  const blocks = data?.page?.latest.blocks ?? [];
  const sidebarBlocks = blocks.filter(isSidebarBlock);
  const mainBlocks = blocks.filter(block => !isSidebarBlock(block));

  return (
    <BkaPageGrid
      className={className}
      data-with-aside={!!sidebarBlocks.length}
    >
      {data?.page && <PageSEO page={data.page} />}

      <ContentWrapper>
        {data?.page && (
          <Blocks
            key={data.page.id}
            blocks={mainBlocks}
            type="Page"
          />
        )}

        {children}
      </ContentWrapper>

      {!!sidebarBlocks.length && (
        <BkaPageAside>
          <Blocks
            key={data?.page?.id}
            blocks={sidebarBlocks}
            type="Page"
          />
        </BkaPageAside>
      )}
    </BkaPageGrid>
  );
};
