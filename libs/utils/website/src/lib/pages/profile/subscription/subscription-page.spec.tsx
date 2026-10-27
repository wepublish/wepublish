import { screen } from '@testing-library/react';
import {
  mockInvoice,
  mockSubscription,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  FeaturesDocument,
  FullInvoiceFragment,
  InvoicesDocument,
  MemberPlanListDocument,
  SubscriptionsDocument,
} from '@wepublish/website/api';

import { ProfileSubscription } from './subscription-page';

const subscription = mockSubscription({ id: 'yearly' });

const invoices = (count: number, canceled = 0) =>
  Array.from({ length: count + canceled }, (_, index) =>
    mockInvoice({
      id: `invoice-${index}`,
      subscription,
      canceledAt: index < canceled ? '2025-02-01T00:00:00.000Z' : null,
      paidAt: index < canceled ? null : '2025-01-01T00:00:00.000Z',
    })
  );

const mocks = (
  features: string[],
  userInvoices: FullInvoiceFragment[] = []
) => [
  {
    request: { query: FeaturesDocument },
    result: { data: { features } },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  {
    request: { query: SubscriptionsDocument },
    result: { data: { userSubscriptions: [subscription] } },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  {
    request: { query: InvoicesDocument },
    result: { data: { userInvoices } },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  {
    request: {
      query: MemberPlanListDocument,
      variables: { take: 50, filter: { active: true } },
    },
    result: {
      data: {
        memberPlans: {
          __typename: 'MemberPlanConnection',
          nodes: [],
          pageInfo: {
            __typename: 'PageInfo',
            startCursor: null,
            endCursor: null,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          totalCount: 0,
        },
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
];

const renderWith = (
  features: string[],
  userInvoices: FullInvoiceFragment[] = []
) => {
  renderWithProviders(<ProfileSubscription id="yearly" />, {
    mocks: mocks(features, userInvoices),
  });
};

describe('ProfileSubscription', () => {
  it('shows the edit page when the medium has the subscription history', async () => {
    renderWith(['profile-subscription-history']);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Abo bearbeiten' })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Zahlung' })
    ).toBeInTheDocument();
  });

  describe('back to the profile', () => {
    const backLinks = () =>
      screen.getAllByRole('link', { name: 'Zurück zum Profil' });

    it('leads back from the title row, as a link with an arrow', async () => {
      renderWith(['profile-subscription-history']);

      const title = await screen.findByRole('heading', {
        level: 1,
        name: 'Abo bearbeiten',
      });
      const [top] = backLinks();
      // first in reading order: above the title where the row wraps
      expect(
        top.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
      expect(top.className).not.toMatch(/MuiButton-root/);
      expect(top.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    });

    it.each([
      ['a short list', 9, 0, 'false'],
      ['ten invoices', 10, 0, 'true'],
      ['ten with cancelled ones, which are hidden', 9, 3, 'false'],
    ])(
      'marks the page as long below the invoices: %s',
      async (_, count, canceled, long) => {
        renderWith(['profile-subscription-history'], invoices(count, canceled));
        await screen.findByRole('heading', {
          level: 1,
          name: 'Abo bearbeiten',
        });
        // the invoices are in
        await screen.findAllByText('Bezahlt');

        const bottom = backLinks()[1];
        expect(bottom.closest('[data-long]')).toHaveAttribute(
          'data-long',
          long
        );
      }
    );
  });

  it('shows the subscription card and its invoices otherwise', async () => {
    renderWith([]);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Rechnungen' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Abo bearbeiten' })
    ).not.toBeInTheDocument();
  });
});
