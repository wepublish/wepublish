import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen, within } from '@testing-library/react';
import {
  CanCreateUser,
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
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

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
});

const theme = createTheme({ cssVariables: true });

const renderList = () =>
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
