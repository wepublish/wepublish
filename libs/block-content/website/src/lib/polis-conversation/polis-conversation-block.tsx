import styled from '@emotion/styled';
import {
  BlockContent,
  PolisConversationBlock as PolisConversationBlockType,
} from '@wepublish/website/api';
import { BuilderPolisConversationBlockProps } from '@wepublish/website/builder';

export const isPolisConversationBlock = (
  block: BlockContent
): block is PolisConversationBlockType =>
  block.__typename === 'PolisConversationBlock';

export const PolisConversationBlockWrapper = styled('div')``;

export function PolisConversationBlock({
  conversationID,
  className,
}: BuilderPolisConversationBlockProps) {
  return (
    <PolisConversationBlockWrapper
      className={className}
    ></PolisConversationBlockWrapper>
  );
}
