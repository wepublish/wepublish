import { Meta } from '@storybook/react';
import { EventListItem } from './event-list-item';
import { mockEvent } from '@wepublish/storybook/mocks';

const event = mockEvent();

export default {
  component: EventListItem,
  title: 'Components/EventList/Item',
} as Meta;

export const Default = {
  args: {
    ...event,
  },
};

export const WithoutImage = {
  args: {
    ...event,
    image: null,
  },
};
