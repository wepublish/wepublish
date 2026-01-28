import { Meta } from '@storybook/react';
import { PageDocument } from '@wepublish/website/api';
import { PageContainer } from './page-container';
import { mockPage } from '@wepublish/storybook/mocks';
import {
  WithPollBlockDecorators,
  WithSubscribeBlockDecorators,
} from '@wepublish/storybook';

const page = mockPage();

export default {
  component: PageContainer,
  title: 'Container/Page',
  decorators: [WithSubscribeBlockDecorators({}), WithPollBlockDecorators({})],
} as Meta;

export const ById = {
  args: {
    id: page.id,
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: PageDocument,
            variables: {
              id: page.id,
            },
          },
          result: {
            data: {
              page,
            },
          },
        },
      ],
    },
  },
};

export const BySlug = {
  args: {
    slug: page.slug,
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: PageDocument,
            variables: {
              slug: page.slug,
            },
          },
          result: {
            data: {
              page,
            },
          },
        },
      ],
    },
  },
};

export const ByToken = {
  args: {
    token: 'foobar',
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: PageDocument,
            variables: {
              token: 'foobar',
            },
          },
          result: {
            data: {
              page,
            },
          },
        },
      ],
    },
  },
};

export const WithChildren = {
  args: {
    id: page.id,
    children: <div>Children</div>,
  },
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: PageDocument,
            variables: {
              id: page.id,
            },
          },
          result: {
            data: {
              page,
            },
          },
        },
      ],
    },
  },
};
