import { Meta } from '@storybook/react';
import { EventBlock } from './event-block';
import { mockEventBlock } from '@wepublish/storybook/mocks';

export default {
  component: EventBlock,
  title: 'Blocks/Event',
} as Meta;

export const Event = {
  args: mockEventBlock(),
};
