import { Meta } from '@storybook/nextjs-vite';
import { PolisConversationBlock } from './polis-conversation-block';
import { mockPolisConversationBlock } from '@wepublish/storybook/mocks';

export default {
  component: PolisConversationBlock,
  title: 'Blocks/Polis Conversation',
} as Meta;

export const Default = {
  args: mockPolisConversationBlock(),
};
