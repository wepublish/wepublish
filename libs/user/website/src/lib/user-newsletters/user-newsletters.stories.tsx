import { action } from 'storybook/actions';
import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MailchimpFormOptionsLayout } from '@wepublish/website/api';
import { UserNewsletters } from './user-newsletters';
import { mockUserNewsletterGroup } from '@wepublish/storybook/mocks';

export default {
  title: 'Components/User Newsletters',
  component: UserNewsletters,
  args: {
    groups: [mockUserNewsletterGroup()],
    onSave: action('onSave'),
  },
} as Meta<typeof UserNewsletters>;

export const Default: StoryObj<typeof UserNewsletters> = {};

export const AsList: StoryObj<typeof UserNewsletters> = {
  args: {
    layout: MailchimpFormOptionsLayout.List,
  },
};

export const Empty: StoryObj<typeof UserNewsletters> = {
  args: {
    groups: [],
  },
};
