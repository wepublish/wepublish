import { ApolloError } from '@apollo/client';
import { Meta } from '@storybook/nextjs-vite';
import { action } from 'storybook/actions';
import {
  Exact,
  FullMyNewsletterListFragment,
  NewsletterListUserStatus,
} from '@wepublish/website/api';
import { NewsletterList } from './newsletter-list';

export default {
  component: NewsletterList,
  title: 'Components/NewsletterList',
} as Meta;

const list = {
  __typename: 'MyNewsletterList',
  id: 'morning',
  name: 'Morgenbriefing',
  slug: 'morgenbriefing',
  description: 'Jeden Morgen die wichtigsten Geschichten aus der Stadt.',
  lockedText: null,
  lockedLinkUrl: null,
  status: NewsletterListUserStatus.Subscribed,
} as Exact<FullMyNewsletterListFragment>;

const subscribed = { ...list };

const notSubscribed = {
  ...list,
  id: 'culture',
  name: 'Kulturtipps',
  slug: 'kulturtipps',
  status: NewsletterListUserStatus.NotSubscribed,
};

const pending = {
  ...list,
  id: 'weekly',
  name: 'Wochenrückblick',
  slug: 'wochenrueckblick',
  status: NewsletterListUserStatus.Pending,
};

const locked = {
  ...list,
  id: 'insider',
  name: 'Insider',
  slug: 'insider',
  lockedText: 'Blick hinter die Kulissen – exklusiv für Mitglieder.',
  lockedLinkUrl: '/abo',
  status: NewsletterListUserStatus.Locked,
};

const paused = {
  ...locked,
  id: 'insider-paused',
  name: 'Insider Paused',
  status: NewsletterListUserStatus.Paused,
};

const lockedWithoutLink = {
  ...locked,
  id: 'insider-plain',
  name: 'Insider Plus',
  lockedText: null,
  lockedLinkUrl: null,
};

const args = {
  subscribeUrl: '/mitmachen',
  onSubscribe: action('onSubscribe'),
  onUnsubscribe: action('onUnsubscribe'),
};

export const Default = {
  args: {
    ...args,
    data: { myNewsletterLists: [subscribed, notSubscribed, pending, locked] },
  },
};

export const Subscribed = {
  args: { ...args, data: { myNewsletterLists: [subscribed] } },
};

export const NotSubscribed = {
  args: { ...args, data: { myNewsletterLists: [notSubscribed] } },
};

export const Pending = {
  args: { ...args, data: { myNewsletterLists: [pending] } },
};

export const LockedTeaser = {
  args: { ...args, data: { myNewsletterLists: [locked] } },
};

export const Paused = {
  args: { ...args, data: { myNewsletterLists: [paused] } },
};

export const LockedWithoutLink = {
  args: { ...args, data: { myNewsletterLists: [lockedWithoutLink] } },
};

export const Empty = {
  args: { ...args, data: { myNewsletterLists: [] } },
};

export const Loading = {
  args: { ...args, loading: true },
};

export const WithError = {
  args: {
    ...args,
    error: new ApolloError({ errorMessage: 'Something went wrong.' }),
  },
};
