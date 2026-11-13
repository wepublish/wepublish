import { screen, waitFor } from '@testing-library/react';
import {
  mockMemberPlan,
  mockOperation,
  mockPaywall,
  mockSensitiveDataUser,
  mockSubscription,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { CanGetArticle } from '@wepublish/permissions';
import {
  ArticleAccessSource,
  FullArticleAccessFragment,
  FullPaywallFragment,
  FullSubscriptionFragment,
  SubscriptionsDocument,
} from '@wepublish/website/api';
import { BYPASS_COOKIE_KEY } from './paywall-bypass';
import {
  decideShowPaywall,
  ShowPaywallContext,
  useShowPaywall,
} from './show-paywall.context';

const memberPlan = mockMemberPlan();
const otherMemberPlan = mockMemberPlan();

const Probe = ({ paywall }: { paywall?: FullPaywallFragment | null }) => {
  const { showPaywall, hideContent } = useShowPaywall(paywall);

  return (
    <output>
      {showPaywall ? 'paywall' : 'no paywall'},
      {hideContent ? 'hidden' : 'visible'}
    </output>
  );
};

const subscriptions = (userSubscriptions: FullSubscriptionFragment[]) =>
  mockOperation(SubscriptionsDocument, {
    variables: {},
    data: { __typename: 'Query', userSubscriptions },
  });

const result = () => screen.getByRole('status');

describe('useShowPaywall', () => {
  afterEach(() => {
    document.cookie = `${BYPASS_COOKIE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });

  it('shows no paywall without a paywall', () => {
    renderWithProviders(<Probe paywall={null} />);

    expect(result()).toHaveTextContent('no paywall,visible');
  });

  it('shows no paywall for an inactive paywall', () => {
    renderWithProviders(<Probe paywall={mockPaywall({ active: false })} />);

    expect(result()).toHaveTextContent('no paywall,visible');
  });

  it('shows the paywall and hides the content for a logged out reader', () => {
    renderWithProviders(
      <Probe paywall={mockPaywall({ memberPlans: [memberPlan] })} />
    );

    expect(result()).toHaveTextContent('paywall,hidden');
  });

  it('lets any subscriber through a paywall for any member plan', async () => {
    renderWithProviders(
      <Probe paywall={mockPaywall({ anyMemberPlan: true })} />,
      {
        user: mockSensitiveDataUser(),
        mocks: [subscriptions([mockSubscription({ memberPlan })])],
      }
    );

    expect(await screen.findByText(/no paywall/)).toHaveTextContent(
      'no paywall,visible'
    );
  });

  it('lets subscribers of a listed member plan through', async () => {
    renderWithProviders(
      <Probe
        paywall={mockPaywall({
          anyMemberPlan: false,
          memberPlans: [memberPlan],
        })}
      />,
      {
        user: mockSensitiveDataUser(),
        mocks: [subscriptions([mockSubscription({ memberPlan })])],
      }
    );

    expect(await screen.findByText(/no paywall/)).toHaveTextContent(
      'no paywall,visible'
    );
  });

  it('keeps the paywall for subscribers of another member plan', async () => {
    const { client } = renderWithProviders(
      <Probe
        paywall={mockPaywall({
          anyMemberPlan: false,
          memberPlans: [memberPlan],
        })}
      />,
      {
        user: mockSensitiveDataUser(),
        mocks: [
          subscriptions([mockSubscription({ memberPlan: otherMemberPlan })]),
        ],
      }
    );

    await waitFor(() =>
      expect(client.readQuery({ query: SubscriptionsDocument })).not.toBeNull()
    );

    expect(result()).toHaveTextContent('paywall,hidden');
  });

  it('ignores inactive subscriptions', async () => {
    const { client } = renderWithProviders(
      <Probe paywall={mockPaywall({ anyMemberPlan: true })} />,
      {
        user: mockSensitiveDataUser(),
        mocks: [
          subscriptions([mockSubscription({ memberPlan, isActive: false })]),
        ],
      }
    );

    await waitFor(() =>
      expect(client.readQuery({ query: SubscriptionsDocument })).not.toBeNull()
    );

    expect(result()).toHaveTextContent('paywall,hidden');
  });

  it('lets users with the article permission through', async () => {
    renderWithProviders(<Probe paywall={mockPaywall()} />, {
      user: mockSensitiveDataUser({ permissions: [CanGetArticle.id] }),
      mocks: [subscriptions([])],
    });

    expect(result()).toHaveTextContent('no paywall,visible');
  });

  it('lets readers with a valid bypass token through', () => {
    document.cookie = `${BYPASS_COOKIE_KEY}=secret; path=/`;

    renderWithProviders(
      <Probe
        paywall={mockPaywall({
          bypasses: [{ __typename: 'PaywallBypass', id: '1', token: 'secret' }],
        })}
      />
    );

    expect(result()).toHaveTextContent('no paywall,visible');
  });

  it('keeps the paywall for an unknown bypass token', () => {
    document.cookie = `${BYPASS_COOKIE_KEY}=guessed; path=/`;

    renderWithProviders(
      <Probe
        paywall={mockPaywall({
          bypasses: [{ __typename: 'PaywallBypass', id: '1', token: 'secret' }],
        })}
      />
    );

    expect(result()).toHaveTextContent('paywall,hidden');
  });

  it('lets the context decide whether to show the paywall and hide the content', () => {
    renderWithProviders(
      <ShowPaywallContext.Provider
        value={{ showPaywall: true, hideContent: false }}
      >
        <Probe paywall={mockPaywall()} />
      </ShowPaywallContext.Provider>
    );

    expect(result()).toHaveTextContent('paywall,visible');
  });
});

const paywall = (overrides: Partial<FullPaywallFragment> = {}) =>
  ({
    __typename: 'Paywall',
    id: 'paywall',
    active: true,
    anyMemberPlan: false,
    enforced: true,
    hideContentAfter: 2,
    fadeout: true,
    memberPlans: [{ id: 'premium', name: 'Premium', tags: [] }],
    bypasses: [],
    ...overrides,
  }) as FullPaywallFragment;

const access = (
  overrides: Partial<FullArticleAccessFragment> = {}
): FullArticleAccessFragment => ({
  __typename: 'ArticleAccess',
  granted: true,
  source: null,
  requirement: null,
  previewBlocks: null,
  paywallId: null,
  ruleId: null,
  stageId: null,
  ...overrides,
});

const decide = (
  overrides: Partial<Parameters<typeof decideShowPaywall>[0]> = {}
) =>
  decideShowPaywall({
    paywall: paywall(),
    memberPlanIds: [],
    canGetArticle: false,
    hasBypass: () => false,
    ctx: {},
    ...overrides,
  });

const shown = { showPaywall: true, hideContent: true };
const hidden = { showPaywall: false, hideContent: false };

describe('decideShowPaywall', () => {
  it('follows the server once it decided about an enforced paywall', () => {
    expect(decide({ serverAccess: access() })).toEqual(hidden);
    expect(
      decide({
        memberPlanIds: ['premium'],
        serverAccess: access({
          granted: false,
          source: ArticleAccessSource.Paywall,
          previewBlocks: 2,
        }),
      })
    ).toEqual(shown);
  });

  it('leaves the article to a metered restriction', () => {
    expect(
      decide({
        serverAccess: access({
          granted: false,
          source: ArticleAccessSource.EngagementRule,
        }),
      })
    ).toEqual(hidden);
  });

  it('decides as before until the server answered', () => {
    expect(decide()).toEqual(shown);
    expect(decide({ memberPlanIds: ['premium'] })).toEqual(hidden);
  });

  it('decides as before for a paywall that is not enforced', () => {
    expect(
      decide({ paywall: paywall({ enforced: false }), serverAccess: access() })
    ).toEqual(shown);
    expect(
      decide({
        paywall: paywall({ enforced: false }),
        memberPlanIds: ['premium'],
      })
    ).toEqual(hidden);
  });

  it('keeps the overrides of the show paywall context', () => {
    expect(
      decide({ serverAccess: access(), ctx: { showPaywall: true } })
    ).toEqual({ showPaywall: true, hideContent: false });
  });

  it('shows nothing for an inactive paywall', () => {
    expect(decide({ paywall: paywall({ active: false }) })).toEqual(hidden);
  });
});
