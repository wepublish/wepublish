import { FullUserNewsletterGroupFragment } from '@wepublish/website/api';
import { mockImage } from './image';

export const mockUserNewsletterGroup = ({
  syncProviderId = 'mailchimp-sync',
  newsletters = [
    {
      __typename: 'UserNewsletter',
      interestId: 'daily',
      name: 'Daily Briefing',
      description: 'Every morning the most important news.',
      subscribed: true,
      image: mockImage(),
    },
    {
      __typename: 'UserNewsletter',
      interestId: 'weekly',
      name: 'Weekly Digest',
      description: 'The best of the week on Saturday.',
      subscribed: false,
      image: mockImage(),
    },
    {
      __typename: 'UserNewsletter',
      interestId: 'events',
      name: 'Events',
      description: null,
      subscribed: false,
      image: null,
    },
  ],
}: Partial<FullUserNewsletterGroupFragment> = {}): FullUserNewsletterGroupFragment => ({
  __typename: 'UserNewsletterGroup',
  syncProviderId,
  newsletters,
});
