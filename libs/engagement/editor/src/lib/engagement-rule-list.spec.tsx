import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  DeleteEngagementRuleDocument,
  EngagementActionRole,
  EngagementActionType,
  EngagementAudience,
  EngagementEnforcement,
  EngagementGoal,
  EngagementPlacement,
  EngagementRulesDocument,
  FullEngagementRuleFragment,
  NewsletterReferralMode,
  PaywallListDocument,
  UpdateEngagementRuleDocument,
} from '@wepublish/editor/api';
import { AuthContext } from '@wepublish/ui/editor';
import { MemoryRouter } from 'react-router-dom';
import { EngagementRuleList } from './engagement-rule-list';

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
          'CAN_GET_ENGAGEMENT_RULES',
          'CAN_UPDATE_ENGAGEMENT_RULE',
          'CAN_DELETE_ENGAGEMENT_RULE',
        ].map(id => ({ id })),
      },
    ],
  },
} as never;

describe('EngagementRuleList', () => {
  let updates: unknown[];
  let deletes: unknown[];

  const mocks = () => [
    {
      request: { query: EngagementRulesDocument },
      result: { data: { engagementRules: [rule] } },
    },
    // Fetched again once a rule was deleted.
    {
      request: { query: EngagementRulesDocument },
      maxUsageCount: Number.POSITIVE_INFINITY,
      result: { data: { engagementRules: [] } },
    },
    {
      request: { query: PaywallListDocument },
      maxUsageCount: Number.POSITIVE_INFINITY,
      result: { data: { paywalls: [] } },
    },
    {
      request: {
        query: UpdateEngagementRuleDocument,
        variables: (variables: unknown) => {
          updates.push(variables);

          return true;
        },
      },
      result: { data: { updateEngagementRule: { ...rule, active: false } } },
    },
    {
      request: {
        query: DeleteEngagementRuleDocument,
        variables: (variables: unknown) => {
          deletes.push(variables);

          return true;
        },
      },
      result: { data: { deleteEngagementRule: rule } },
    },
  ];

  const renderList = () =>
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <AuthContext.Provider value={session}>
          <MockedProvider mocks={mocks()}>
            <MemoryRouter>
              <EngagementRuleList />
            </MemoryRouter>
          </MockedProvider>
        </AuthContext.Provider>
      </ThemeProvider>
    );

  beforeEach(() => {
    updates = [];
    deletes = [];
  });

  // The table renders its rows again once it measured them, so elements are
  // looked up once that settled.
  const settled = () =>
    waitFor(() => expect(screen.getByText('Crowdfunding')).toBeInTheDocument());

  it('lists the rules', async () => {
    renderList();

    await settled();
  });

  it('switches a rule off, keeping everything else', async () => {
    renderList();

    await settled();
    fireEvent.click(screen.getByLabelText('engagement.list.toggle'));

    await waitFor(() => expect(updates).toHaveLength(1));
    expect(updates[0]).toMatchObject({
      input: {
        id: 'rule-1',
        active: false,
        name: 'Crowdfunding',
        stages: [{ title: 'Help us', actions: [{ label: 'Give' }] }],
      },
    });
  });

  it('deletes a rule after asking', async () => {
    renderList();

    await settled();
    fireEvent.click(screen.getByRole('button', { name: 'delete' }));
    fireEvent.click(await screen.findByText('engagement.delete.confirm'));

    await waitFor(() => expect(deletes).toEqual([{ id: 'rule-1' }]));
    // The list is fetched again without it; leaving earlier aborts that fetch.
    await waitFor(() =>
      expect(screen.queryByText('Crowdfunding')).not.toBeInTheDocument()
    );
  });
});
