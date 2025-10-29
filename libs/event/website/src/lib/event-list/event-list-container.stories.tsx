import { Meta } from '@storybook/react';
import { EventListDocument } from '@wepublish/website/api';
import { EventListContainer } from './event-list-container';
import { mockEvent } from '@wepublish/storybook/mocks';

export default {
  component: EventListContainer,
  title: 'Container/EventList',
} as Meta;

export const Default = {
  args: {},

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: EventListDocument,
            variables: {},
          },
          result: {
            data: {
              events: {
                nodes: [mockEvent(), mockEvent(), mockEvent()],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  endCursor: null,
                  startCursor: null,
                },
              },
            },
          },
        },
      ],
    },
  },
};
