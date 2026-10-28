import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import {
  EngagementActionRole,
  EngagementActionType,
  EngagementAudience,
  EngagementEnforcement,
  EngagementGoal,
  EngagementPlacement,
  EngagementRuleDocument,
  FullEngagementRuleFragment,
  NewsletterReferralMode,
} from '@wepublish/editor/api';
import { AuthContext } from '@wepublish/ui/editor';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CreateEngagementRule } from './create-engagement-rule';

const rule: FullEngagementRuleFragment = {
  __typename: 'EngagementRule',
  id: 'rule-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  name: 'Crowdfunding',
  goal: EngagementGoal.Announcement,
  active: true,
  priority: 0,
  version: 1,
  audience: EngagementAudience.All,
  showOnArticles: true,
  showOnPageIds: [],
  includePeeredArticles: false,
  meterWindowDays: null,
  newsletterReferral: NewsletterReferralMode.None,
  newsletterReferralLimit: 0,
  newsletterParams: [],
  stages: [
    {
      __typename: 'EngagementStage',
      id: 'stage-1',
      afterArticles: 0,
      placement: EngagementPlacement.Banner,
      enforcement: EngagementEnforcement.Soft,
      requirement: null,
      previewBlocks: null,
      dismissible: true,
      hideForMinutes: 1440,
      delaySeconds: 0,
      title: 'Help us',
      text: null,
      cta: null,
      description: null,
      html: null,
      embedUrl: null,
      imageId: null,
      image: null,
      actions: [
        {
          __typename: 'EngagementAction',
          id: 'action-1',
          type: EngagementActionType.Url,
          label: 'Give',
          url: 'https://example.com',
          style: '',
          role: EngagementActionRole.Primary,
        },
      ],
    },
  ],
};

const session = {
  session: {
    sessionRoles: [
      {
        permissions: [
          'CAN_CREATE_ENGAGEMENT_RULE',
          'CAN_UPDATE_ENGAGEMENT_RULE',
        ].map(id => ({ id })),
      },
    ],
  },
} as never;

const renderCreate = (path: string) =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <AuthContext.Provider value={session}>
        <MockedProvider
          mocks={[
            {
              request: {
                query: EngagementRuleDocument,
                variables: { id: 'rule-1' },
              },
              result: { data: { engagementRule: rule } },
            },
          ]}
        >
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route
                path="/audience-engagement/create"
                element={<CreateEngagementRule />}
              />
            </Routes>
          </MemoryRouter>
        </MockedProvider>
      </AuthContext.Provider>
    </ThemeProvider>
  );

describe('CreateEngagementRule', () => {
  it('starts with the presets', () => {
    renderCreate('/audience-engagement/create');

    expect(
      screen.getByText('engagement.preset.growNewsletter')
    ).toBeInTheDocument();
  });

  it('opens a copy of a rule without saving it', async () => {
    renderCreate('/audience-engagement/create?copyOf=rule-1');

    expect(
      await screen.findByDisplayValue('engagement.copyName')
    ).toBeInTheDocument();
    expect(screen.queryByText('engagement.preset.growNewsletter')).toBeNull();
    expect(screen.getByLabelText('engagement.form.active')).not.toBeChecked();
    expect(screen.getByDisplayValue('Help us')).toBeInTheDocument();
  });
});
