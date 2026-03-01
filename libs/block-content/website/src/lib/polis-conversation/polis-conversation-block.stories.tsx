import { Meta } from '@storybook/react';
import { PolisConversationBlock } from './polis-conversation-block';
import { mockPolisConversationBlock } from '@wepublish/storybook/mocks';

export default {
  component: PolisConversationBlock,
  title: 'Blocks/Polis Conversation',
} as Meta;

export const Default = {
  args: mockPolisConversationBlock(),
  parameters: {
    chromatic: { disableSnapshot: true }, // loads live Polis embed — snapshot would always differ
  },
};
