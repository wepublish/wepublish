import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { UserSort } from '@wepublish/editor/api';
import {
  CanCreateUser,
  CanGetPrintIssues,
  CanDeleteUser,
  CanGetUser,
  CanGetUsers,
  CanResetUserPassword,
  CanResetUserTotp,
} from '@wepublish/permissions';
import { AuthContext } from '@wepublish/ui/editor';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import { UserList } from './userList';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useLazyQuery: () => [vi.fn(), { loading: false }],
  useMutation: () => [vi.fn(), { loading: false }],
  useApolloClient: () => ({ query: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options && 'received' in options ?
        `${key} ${options['received']}/${options['entitled']}`
      : key,
    i18n: { language: 'en' },
  }),
}));

const features = vi.fn(() => new Set<string>());

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  useFeature: (feature: string) => features().has(feature),
}));

afterEach(() => features.mockReturnValue(new Set()));

const mockedUseQuery = useQuery as unknown as Mock;

const user = (id: string, name: string, managedByWepublishLogin: boolean) => ({
  id,
  createdAt: '2026-01-02T10:00:00.000Z',
  modifiedAt: '2026-01-02T10:00:00.000Z',
  name,
  firstName: 'Jane',
  active: true,
  lastLogin: null,
  email: `${id}@wepublish.ch`,
  totpEnabled: true,
  managedByWepublishLogin,
  roles: [],
  subscriptionCount: 0,
  subscriptionOverview: [],
  printIssuesOwed: null,
  printIssueProgress: null,
});

const theme = createTheme({ cssVariables: true });

const renderList = ({ printIssues = false } = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <AuthContext.Provider
        value={
          {
            session: {
              sessionRoles: [
                {
                  id: 'role',
                  permissions: [
                    CanGetUsers,
                    CanGetUser,
                    CanCreateUser,
                    CanDeleteUser,
                    CanResetUserPassword,
                    CanResetUserTotp,
                    ...(printIssues ? [CanGetPrintIssues] : []),
                  ].map(({ id }) => ({ id })),
                },
              ],
            },
          } as never
        }
      >
        <MemoryRouter initialEntries={['/users']}>
          <UserList />
        </MemoryRouter>
      </AuthContext.Provider>
    </ThemeProvider>
  );

beforeEach(() => {
  localStorage.clear();
  mockedUseQuery.mockReset();
  mockedUseQuery.mockReturnValue({
    data: {
      users: {
        nodes: [user('staff', 'Staff', true), user('reader', 'Reader', false)],
        totalCount: 2,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
      },
    },
    loading: false,
    refetch: vi.fn(),
  });
});

const rowOf = async (name: string) =>
  (await screen.findByText(name)).closest('tr') as HTMLElement;

const ACTIONS = [
  'userList.overview.resetPassword',
  'userList.overview.resetTotp',
  'delete',
];

describe('UserList', () => {
  it('offers no actions for an account managed by the We.Publish login, and says why', async () => {
    renderList();
    const row = await rowOf('Staff');

    for (const label of ACTIONS) {
      expect(
        within(row).queryByRole('button', { name: label })
      ).not.toBeInTheDocument();
    }
    expect(
      within(row).getByText('userList.overview.managedByWepublishLogin')
    ).toBeInTheDocument();
  });

  it('still offers them for every other account', async () => {
    renderList();
    const row = await rowOf('Reader');

    for (const label of ACTIONS) {
      expect(within(row).getByRole('button', { name: label })).toBeEnabled();
    }
    expect(
      within(row).queryByText('userList.overview.managedByWepublishLogin')
    ).not.toBeInTheDocument();
  });
});

describe('UserList print issues', () => {
  const OWED = 'userList.overview.printIssuesOwed';

  const reader = {
    ...user('reader', 'Reader', false),
    subscriptionCount: 2,
    subscriptionOverview: [
      { id: 'sub-1', memberPlanName: 'Basic', status: 'active' },
      { id: 'sub-2', memberPlanName: 'Gönner', status: 'deactivated' },
    ],
    printIssuesOwed: 5,
    printIssueProgress: [
      { subscriptionId: 'sub-1', received: 7, entitled: 12, relevant: true },
      { subscriptionId: 'sub-2', received: 3, entitled: 6, relevant: false },
    ],
  };

  beforeEach(() => {
    mockedUseQuery.mockReturnValue({
      data: {
        users: {
          nodes: [reader],
          totalCount: 1,
          pageInfo: { hasNextPage: false, hasPreviousPage: false },
        },
      },
      loading: false,
      refetch: vi.fn(),
    });
  });

  it('shows the issues still owed and sorts by them', async () => {
    features.mockReturnValue(new Set(['print-export']));
    renderList({ printIssues: true });

    const row = await rowOf('Reader');
    expect(within(row).getByText('5')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: OWED }));

    expect(mockedUseQuery).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({
        variables: expect.objectContaining({
          sort: UserSort.PrintIssuesOwed,
        }),
      })
    );
  });

  it('adds the received issues to the subscriptions that still count', async () => {
    features.mockReturnValue(new Set(['print-export']));
    renderList({ printIssues: true });

    fireEvent.mouseOver(
      await screen.findByText('userList.overview.amountOfSubscriptions')
    );

    const tooltip = await screen.findByRole('tooltip');
    expect(
      within(tooltip).getByText(
        'userList.overview.subscriptionWithStatusAndIssues 7/12'
      )
    ).toBeInTheDocument();
    expect(
      within(tooltip).getByText('userList.overview.subscriptionWithStatus')
    ).toBeInTheDocument();
  });

  it('has no such column without print-export', async () => {
    renderList({ printIssues: true });

    await rowOf('Reader');
    expect(screen.queryByText(OWED)).not.toBeInTheDocument();
  });

  it('has no such column without the permission', async () => {
    features.mockReturnValue(new Set(['print-export']));
    renderList();

    await rowOf('Reader');
    expect(screen.queryByText(OWED)).not.toBeInTheDocument();
  });
});
