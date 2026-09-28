import { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  AddMailchimpContactDocument,
  MailchimpFormListsLayout,
} from '@wepublish/website/api';
import {
  mockMailchimpFormBlock,
  mockMultipleListsMailchimpFormBlock,
} from '@wepublish/storybook/mocks';
import { MailchimpFormBlock } from './mailchimp-form-block';

const apolloClient = {
  mocks: [
    {
      request: {
        query: AddMailchimpContactDocument,
      },
      variableMatcher: () => true,
      maxUsageCount: Number.POSITIVE_INFINITY,
      result: {
        data: {
          addMailchimpContact: {
            __typename: 'MailchimpSubscribeResult',
            success: true,
            error: null,
          },
        },
      },
    },
  ],
};

export default {
  component: MailchimpFormBlock,
  title: 'Blocks/Mailchimp Form',
  parameters: { apolloClient },
} as Meta<typeof MailchimpFormBlock>;

type Story = StoryObj<typeof MailchimpFormBlock>;

export const Default: Story = {
  args: mockMailchimpFormBlock(),
};

export const MultipleListsAsList: Story = {
  args: mockMultipleListsMailchimpFormBlock({
    listsLayout: MailchimpFormListsLayout.List,
  }),
};

export const MultipleListsAsGrid: Story = {
  args: mockMultipleListsMailchimpFormBlock({
    listsLayout: MailchimpFormListsLayout.Grid,
  }),
};
