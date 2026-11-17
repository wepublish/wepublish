import {
  mockAnnouncementPrompt,
  mockEngagementAction,
} from '@wepublish/mocks/website';
import {
  BannerActionRole,
  EngagementActionRole,
  EngagementActionType,
} from '@wepublish/website/api';
import { TFunction } from 'i18next';
import { promptToBanner } from './prompt-to-banner';

const t = ((key: string) => `t:${key}`) as unknown as TFunction;

describe('promptToBanner', () => {
  it('maps a banner prompt onto the fragment the Banner component reads', () => {
    expect(
      promptToBanner(
        mockAnnouncementPrompt({
          delaySeconds: 3,
          hideForMinutes: 60,
          dismissible: false,
          cta: 'Join now',
          actions: [
            mockEngagementAction(),
            mockEngagementAction({
              id: 'login',
              type: EngagementActionType.Login,
              label: '',
              url: '',
              role: EngagementActionRole.Cancel,
            }),
          ],
        }),
        t
      )
    ).toEqual({
      __typename: 'Banner',
      id: 'announcement-1',
      title: 'Our annual crowdfunding',
      text: 'Help us reach 1000 members.',
      cta: 'Join now',
      collapsible: false,
      html: null,
      embedUrl: null,
      delay: 3,
      hideForMinutes: 60,
      showOnArticles: true,
      showOnPages: [],
      image: null,
      actions: [
        {
          __typename: 'BannerAction',
          id: 'action-1',
          label: 'Subscribe to our newsletter',
          url: 'https://example.com/newsletter',
          style: '',
          role: BannerActionRole.Primary,
        },
        {
          __typename: 'BannerAction',
          id: 'login',
          label: 't:engagement.action.LOGIN',
          url: '/login',
          style: '',
          role: BannerActionRole.Cancel,
        },
      ],
    });
  });
});
