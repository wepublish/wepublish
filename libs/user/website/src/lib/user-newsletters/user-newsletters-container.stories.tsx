import { StoryObj } from '@storybook/nextjs-vite';
import {
  UpdateUserNewslettersDocument,
  UserNewslettersDocument,
} from '@wepublish/website/api';
import { UserNewslettersContainer } from './user-newsletters-container';
import { mockUserNewsletterGroup } from '@wepublish/storybook/mocks';

export default {
  title: 'Container/User Newsletters',
  component: UserNewslettersContainer,
};

const group = mockUserNewsletterGroup();

const updateVariables = {
  input: {
    syncProviderId: group.syncProviderId,
    newsletters: [{ interestId: 'weekly', subscribed: true }],
  },
};

const updateResult = {
  data: {
    updateUserNewsletters: mockUserNewsletterGroup({
      newsletters: group.newsletters.map(newsletter =>
        newsletter.interestId === 'weekly' ?
          { ...newsletter, subscribed: true }
        : newsletter
      ),
    }),
  },
};

export const Default: StoryObj = {
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: { query: UserNewslettersDocument },
          result: { data: { userNewsletters: [group] } },
        },
        {
          request: {
            query: UpdateUserNewslettersDocument,
            variables: updateVariables,
          },
          result: updateResult,
        },
      ],
    },
  },
};

export const WithoutNewsletters: StoryObj = {
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: { query: UserNewslettersDocument },
          result: { data: { userNewsletters: [] } },
        },
      ],
    },
  },
};
