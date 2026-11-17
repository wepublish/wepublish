import { screen } from '@testing-library/react';
import {
  mockMemberPlan,
  mockSensitiveDataUser,
  mockSubscription,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  FullSubscriptionFragment,
  InvoicesDocument,
  ProductType,
  SubscriptionsDocument,
} from '@wepublish/website/api';

import { ProfilePage } from './profile-page';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useSearch: () => ({}),
  useRouterState: ({ select }: { select: (state: unknown) => unknown }) =>
    select({ location: { href: '/profile' } }),
}));

const activeSubscription = mockSubscription({
  id: 'active',
  memberPlan: mockMemberPlan({
    name: 'Mitgliedschaft',
    productType: ProductType.Subscription,
  }),
  isActive: true,
  deactivation: null,
}) as FullSubscriptionFragment;

const mocks = [
  {
    request: { query: SubscriptionsDocument },
    result: { data: { userSubscriptions: [activeSubscription] } },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  {
    request: { query: InvoicesDocument },
    result: { data: { userInvoices: [] } },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
];

const renderProfile = (subscribeAnotherUrl?: string) =>
  renderWithProviders(
    <ProfilePage subscribeAnotherUrl={subscribeAnotherUrl} />,
    { mocks, user: mockSensitiveDataUser() }
  );

describe('ProfilePage', () => {
  it('links to another subscription at /mitmachen by default', async () => {
    renderProfile();

    expect(
      await screen.findByRole('link', { name: 'Anderes Abo lösen' })
    ).toHaveAttribute('href', '/mitmachen');
  });

  it('links to another subscription at the url the medium sets', async () => {
    renderProfile('/upgrade');

    expect(
      await screen.findByRole('link', { name: 'Anderes Abo lösen' })
    ).toHaveAttribute('href', '/upgrade');
  });
});
