import { Meta } from '@storybook/react';
import { EventDocument } from '@wepublish/website/api';
import { EventContainer } from './event-container';
import { mockEvent } from '@wepublish/storybook/mocks';

const event = mockEvent();

export default {
  component: EventContainer,
  title: 'Container/Event',
} as Meta;

export const Default = {
  args: {
    id: event.id,
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: EventDocument,
            variables: {
              id: event.id,
            },
          },
          result: {
            data: {
              event,
            },
          },
        },
      ],
    },
  },
};
