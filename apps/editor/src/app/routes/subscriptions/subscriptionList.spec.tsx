import type { Mock } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { ReactivateSubscriptionDocument } from '@wepublish/editor/api';

import { SubscriptionList } from './subscriptionList';

const { mutationFor } = vi.hoisted(() => {
  const mutations = new Map<unknown, Mock>();

  return {
    mutationFor: (document: unknown) => {
      if (!mutations.has(document)) {
        mutations.set(
          document,
          vi.fn(async () => ({ data: {} }))
        );
      }

      return mutations.get(document) as Mock;
    },
  };
});

// Partial mock: the list also renders components that use other Apollo hooks.
vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useLazyQuery: () => [vi.fn(), { loading: false }],
  useMutation: (document: unknown) => [
    mutationFor(document),
    { loading: false },
  ],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  // The permission wrappers would otherwise need an authenticated session.
  createCheckedPermissionComponent: () => (component: unknown) => component,
  PermissionControl: ({ children }: { children: React.ReactNode }) => children,
  useAuthorisation: () => true,
}));

const mockedUseQuery = useQuery as unknown as Mock;

const subscription = {
  id: 'subscription-1',
  createdAt: '2026-01-02T10:00:00.000Z',
  modifiedAt: '2026-09-28T15:30:00.000Z',
  user: { id: 'user-1', name: 'Muster', firstName: 'Max' },
  memberPlan: { id: 'plan-1', name: 'Yearly' },
  deactivation: null,
};

const deactivatedSubscription = {
  ...subscription,
  id: 'subscription-2',
  deactivation: { date: '2026-02-01T10:00:00.000Z', reason: 'none' },
};

const mockSubscriptions = (nodes: unknown[]) =>
  mockedUseQuery.mockReturnValue({
    data: {
      subscriptions: {
        nodes,
        totalCount: nodes.length,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
      },
    },
    refetch: vi.fn(),
    loading: false,
  });

const renderList = () =>
  render(
    <MemoryRouter>
      <SubscriptionList />
    </MemoryRouter>
  );

beforeEach(() => {
  localStorage.clear();
  mockedUseQuery.mockReset();
  mutationFor(ReactivateSubscriptionDocument).mockClear();
});

describe('SubscriptionList', () => {
  it('offers no reactivation for a running subscription', async () => {
    mockSubscriptions([subscription]);
    renderList();

    expect(await screen.findByTestId('deleteSubscription')).toBeTruthy();
    expect(screen.queryByTestId('reactivateSubscription')).toBeNull();
  });

  it('marks a deactivated subscription next to its member plan', async () => {
    mockSubscriptions([deactivatedSubscription]);
    renderList();

    const memberPlanCell = (await screen.findByText('Yearly')).parentElement;

    expect(
      memberPlanCell?.querySelector('[data-testid="deactivationIcon"]')
    ).toBeTruthy();
  });

  it('reactivates a deactivated subscription after confirmation', async () => {
    mockSubscriptions([deactivatedSubscription]);
    renderList();

    fireEvent.click(await screen.findByTestId('reactivateSubscription'));

    const reactivate = mutationFor(ReactivateSubscriptionDocument);
    expect(reactivate).not.toHaveBeenCalled();

    fireEvent.click(
      await screen.findByText('userSubscriptionEdit.reactivation.confirm')
    );

    expect(reactivate).toHaveBeenCalledWith({
      variables: { id: 'subscription-2' },
    });
  });
});
