import { fireEvent, render, screen } from '@testing-library/react';
import {
  UserDocument,
  UserSubscriptionListDocument,
} from '@wepublish/editor/api';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Mock } from 'vitest';

import { UserEditView } from './userEditView';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useLazyQuery: () => [vi.fn(), { loading: false }],
  useApolloClient: () => ({ query: vi.fn(async () => ({ data: {} })) }),
  useMutation: () => [vi.fn(async () => ({ data: {} })), { loading: false }],
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

const { useQuery } = await import('@apollo/client/react');
const mockedUseQuery = useQuery as unknown as Mock;

const user = {
  id: 'user-1',
  createdAt: '2023-01-01T00:00:00.000Z',
  modifiedAt: '2023-01-01T00:00:00.000Z',
  name: 'Muster',
  firstName: null,
  flair: null,
  birthday: null,
  note: null,
  email: 'max@test.ch',
  emailVerifiedAt: null,
  active: true,
  address: null,
  image: null,
  roles: [],
  properties: [],
  paymentProviderCustomers: [],
  oauth2Accounts: [],
};

const subscription = {
  id: 'subscription-1',
  createdAt: '2023-01-01T00:00:00.000Z',
  startsAt: '2023-01-01T00:00:00.000Z',
  memberPlan: { name: 'Jahresabo' },
  paymentPeriodicity: 'yearly',
  monthlyAmount: 1000,
  currency: 'CHF',
  autoRenew: true,
  confirmed: true,
  paidUntil: '2999-01-01T00:00:00.000Z',
  deactivation: null,
  periods: [],
};

const mockQueries = (results: [unknown, unknown][] = []) => {
  // The results have to be referentially stable, the view reacts to them in effects.
  const refetch = vi.fn();
  const byDocument = new Map(
    results.map(([document, data]) => [
      document,
      { loading: false, refetch, data },
    ])
  );
  const fallback = { loading: false, refetch, data: undefined };

  mockedUseQuery.mockImplementation(
    (document: unknown) => byDocument.get(document) ?? fallback
  );
};

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/users/create"
          element={<UserEditView />}
        />
        <Route
          path="/users/edit/:id"
          element={<UserEditView />}
        />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => mockedUseQuery.mockReset());
afterEach(() => vi.restoreAllMocks());

describe('UserEditView', () => {
  it('keeps the empty first name field controlled while typing', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    mockQueries();
    const { container } = renderAt('/users/create');

    fireEvent.change(
      container.querySelector('input[name="firstName"]') as HTMLInputElement,
      { target: { value: 'Max' } }
    );

    expect(
      consoleError.mock.calls.filter(call =>
        /uncontrolled/.test(String(call[0]))
      )
    ).toEqual([]);
  });

  it('gives the subscriptions their own full-width row below the columns', async () => {
    mockQueries([
      [UserDocument, { user }],
      [
        UserSubscriptionListDocument,
        { subscriptions: { nodes: [subscription] } },
      ],
    ]);
    renderAt('/users/edit/user-1');

    const subscriptionsHeader = await screen.findByText(
      'userCreateOrEditView.subscriptionsHeader'
    );

    expect(subscriptionsHeader.closest('[data-testid="user-columns"]')).toBe(
      null
    );
    expect(screen.getByTestId('user-columns')).toBeTruthy();
  });
});
