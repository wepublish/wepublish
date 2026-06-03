import styled from '@emotion/styled';
import {
  BlockContent,
  FullPolisConversationBlockFragment,
} from '@wepublish/website/api';
import { BuilderPolisConversationBlockProps } from '@wepublish/website/builder';

export const isPolisConversationBlock = (
  block: Pick<BlockContent, '__typename'>
): block is FullPolisConversationBlockFragment =>
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
