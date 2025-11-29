import styled from '@emotion/styled';
import {
  BlockContent,
  FlexBlock as FlexBlockType,
} from '@wepublish/website/api';
import {
  BuilderFlexBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { FlexAlignment } from '@wepublish/website/api';
import { css } from '@emotion/react';

const FlexBlockWrapper = styled('div')`
  display: grid;
  column-gap: ${({ theme }) => theme.spacing(2)};
  row-gap: ${({ theme }) => theme.spacing(8)};
  grid-template-columns: repeat(12, 1fr);
  grid-column: 1 / -1;
`;
export const NestedBlock = styled('div')<FlexAlignment>`
  grid-column: 1 / -1;

  ${({ theme, w }) =>
    w > 6 &&
    css`
      grid-column: 1 / -1;
    `}

  ${({ theme, h, w, x, y }) => css`
    ${theme.breakpoints.up('md')} {
      grid-column-start: ${x + 1};
      grid-column-end: ${x + 1 + w};

      grid-row-start: ${y + 1};
      grid-row-end: ${y + 1 + h};
    }
  `}
`;

export const isFlexBlock = (
  block: Pick<BlockContent, '__typename'>
): block is FlexBlockType => {
  return block.__typename === 'FlexBlock';
};

export const FlexBlock = ({ className, blocks }: BuilderFlexBlockProps) => {
  const {
    blocks: { Renderer },
  } = useWebsiteBuilder();

  return (
    <FlexBlockWrapper>
      {blocks.map((nestedBlock, index) => {
        return (
          <NestedBlock
            key={index}
            {...(nestedBlock.alignment as FlexAlignment)}
          >
            <Renderer
              block={nestedBlock.block as BlockContent}
              type="Article"
              index={index}
              count={blocks.length}
            />
          </NestedBlock>
        );
      })}
    </FlexBlockWrapper>
  );
};
