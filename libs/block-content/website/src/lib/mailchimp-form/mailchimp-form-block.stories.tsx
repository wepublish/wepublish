import { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  AddMailchimpContactDocument,
  MailchimpFormOptionsLayout,
} from '@wepublish/website/api';
import {
  mockMailchimpFormBlock,
  mockInterestsMailchimpFormBlock,
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

export const InterestsAsList: Story = {
  args: mockInterestsMailchimpFormBlock(
    {},
    { optionsLayout: MailchimpFormOptionsLayout.List }
  ),
};

export const InterestsAsGrid: Story = {
  args: mockInterestsMailchimpFormBlock(
    {},
    { optionsLayout: MailchimpFormOptionsLayout.Grid }
  ),
};
