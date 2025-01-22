import styled from '@emotion/styled'
import {Block, PolisConversationBlock as PolisConversationBlockType} from '@wepublish/website/api'
import {BuilderPolisConversationBlockProps} from '@wepublish/website/builder'

export const isPolisConversationBlock = (block: Block): block is PolisConversationBlockType =>
  block.__typename === 'PolisConversationBlock'

export const PolisConversationBlockWrapper = styled('div')``

export function PolisConversationBlock({
  conversationID,
  className
}: BuilderPolisConversationBlockProps) {
  return <PolisConversationBlockWrapper className={className}></PolisConversationBlockWrapper>
}
