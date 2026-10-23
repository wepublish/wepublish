import { Meta } from '@storybook/nextjs-vite';
import { Event } from './event';
import { mockEventDetail, mockRichTextBlock } from '@wepublish/storybook/mocks';
import { EventStatus } from '@wepublish/website/api';

const event = mockEventDetail({
  latest: {
    __typename: 'EventRevision',
    id: 'revision-1',
    blocks: [
      mockRichTextBlock({
        richText: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Text aus den Blöcken' }],
            },
          ],
        },
      }),
    ],
  },
});

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

export const WithoutRevision = {
  args: {
    data: {
      event: { ...event, latest: null },
    },
  },
};

export const WithoutNameAndDates = {
  args: {
    data: {
      event: {
        ...event,
        name: null,
        startsAt: null,
        endsAt: null,
        location: null,
      },
    },
  },
};

export const Cancelled = {
  args: {
    data: {
      event: { ...event, status: EventStatus.Cancelled },
    },
  },
};
