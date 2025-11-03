import styled from '@emotion/styled';
import {
  BlockContent,
  FlexBlock as FlexBlockType,
} from '@wepublish/website/api';
import { BuilderFlexBlockProps } from '@wepublish/website/builder';

const FlexBlockWrapper = styled('div')`
  background-color: lime;
`;

export const isFlexBlock = (
  block: Pick<BlockContent, '__typename'>
): block is FlexBlockType => {
  const retVal = block.__typename === 'FlexBlock';
  console.log('Checking if block is FlexBlock:', block, retVal);
  return retVal;
};

export const FlexBlock = ({ className }: BuilderFlexBlockProps) => {
  console.log('Rendering FlexBlock');

  return <FlexBlockWrapper>Flex Block</FlexBlockWrapper>;
};
