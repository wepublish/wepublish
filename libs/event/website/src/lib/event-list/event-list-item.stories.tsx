import { Meta } from '@storybook/nextjs-vite';
import { EventListItem } from './event-list-item';
import { mockEvent } from '@wepublish/storybook/mocks';
import { EventStatus } from '@wepublish/website/api';

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

export const Cancelled = {
  args: {
    ...event,
    status: EventStatus.Cancelled,
  },
};

export const Postponed = {
  args: {
    ...event,
    status: EventStatus.Postponed,
  },
};

export const SoldOut = {
  args: {
    ...event,
    status: EventStatus.SoldOut,
  },
};

export const WithoutName = {
  args: {
    ...event,
    name: null,
  },
};

export const WithoutDates = {
  args: {
    ...event,
    startsAt: null,
    endsAt: null,
  },
};
