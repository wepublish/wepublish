import styled from '@emotion/styled';
import {
  BlockContent,
  FlexBlock as FlexBlockType,
} from '@wepublish/website/api';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { BuilderFlexBlockProps } from '@wepublish/website/builder';
import { FlexAlignment } from '@wepublish/website/api';
import { css } from '@emotion/react';

const FlexBlockWrapper = styled('div')`
  display: grid;
  column-gap: ${({ theme }) => theme.spacing(2)};
  row-gap: ${({ theme }) => theme.spacing(2)};
  grid-template-columns: repeat(12, 1fr);
`;
export const NestedBlock = styled('div')<FlexAlignment>`
  background-color: lime;

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
  const retVal = block.__typename === 'FlexBlock';
  //console.log('Checking if block is FlexBlock:', block, retVal);
  return retVal;
};

export const FlexBlock = ({
  className,
  nestedBlocks,
}: BuilderFlexBlockProps) => {
  return (
    <FlexBlockWrapper>
      {nestedBlocks.map((nestedBlock, index) => {
        if (nestedBlock && nestedBlock.alignment) {
          return (
            <NestedBlock
              key={index}
              {...(nestedBlock.alignment as FlexAlignment)}
            >
              {`${JSON.stringify(nestedBlock)}`}
            </NestedBlock>
          );
        } else if (!nestedBlock || !nestedBlock.block) {
          return (
            <div
              key={index}
            >{`No block defined ${JSON.stringify(nestedBlock)}`}</div>
          );
        }

        const BlockComponent =
          nestedBlock.block &&
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          nestedBlock.block.type &&
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          require(`@wepublish/website/builder`).blocks[nestedBlock.block.type];
        if (!BlockComponent) {
          console.warn(
            `No block component found for type: ${nestedBlock.block.type}`
          );
          return (
            <div
              key={index}
            >{`No block component found for type: ${nestedBlock.block.type}`}</div>
          );
        }

        return (
          <NestedBlock
            key={index}
            {...(nestedBlock.alignment as FlexAlignment)}
          >
            <BlockComponent {...nestedBlock.block} />
          </NestedBlock>
        );
      })}
    </FlexBlockWrapper>
  );
};
