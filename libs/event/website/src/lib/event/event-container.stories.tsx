import { Meta } from '@storybook/nextjs-vite';
import { EventDocument } from '@wepublish/website/api';
import { EventContainer } from './event-container';
import { mockEventDetail } from '@wepublish/storybook/mocks';

const event = mockEventDetail();

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

export const BySlug = {
  args: {
    slug: event.slug,
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: EventDocument,
            variables: {
              slug: event.slug,
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
