import {Meta} from '@storybook/react'
import {PolisConversationBlock} from './polis-conversation-block'

export default {
  component: PolisConversationBlock,
  title: 'Blocks/Polis Conversation'
} as Meta

export const Default = {
  args: {
    conversationID: '744469711'
  }
}

export const WithClassName = {
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}
