import { Meta } from '@storybook/nextjs-vite';
import { Event } from './event';
import { mockEvent } from '@wepublish/storybook/mocks';

const event = mockEvent();

export default {
  component: Event,
  title: 'Components/Event',
} as Meta;

export const Default = {
  args: {
    data: {
      event,
    },
  },
};

export const WithLoading = {
  args: {
    data: undefined,
    loading: true,
  },
};

export const WithError = {
  args: {
    data: undefined,
    loading: false,
    error: new Error('Foobar'),
  },
};

export const WithoutImage = {
  args: {
    data: {
      event: { ...event, image: null },
    },
  },
};
