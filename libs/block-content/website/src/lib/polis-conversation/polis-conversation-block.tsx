import styled from '@emotion/styled';
import {
  FullBlockFragment,
  FullPolisConversationBlockFragment,
} from '@wepublish/website/api';
import { BuilderPolisConversationBlockProps } from '@wepublish/website/builder';

export const isPolisConversationBlock = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
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
