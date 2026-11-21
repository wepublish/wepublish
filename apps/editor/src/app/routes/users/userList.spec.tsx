import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { TinyUserListDocument, UserSort } from '@wepublish/editor/api';
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
  emailQuality:
    id === 'reader' ?
      { level: 'dead', since: '2026-03-04T10:00:00.000Z' }
    : null,
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

describe('UserList email status', () => {
  const headers = () =>
    screen.getAllByRole('columnheader').map(header => header.textContent);

  const showColumn = (name: string) => {
    fireEvent.click(
      screen.getByRole('button', { name: /columnConfigurator.title/ })
    );
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name }));
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
  };

  it('hides both email status columns until switched on', async () => {
    renderList();
    await rowOf('Reader');

    expect(headers()).not.toContain('userList.overview.emailQuality');
    expect(headers()).not.toContain('userList.overview.emailQualitySince');
  });

  it('shows the segment as plain text, never-evaluated people as unknown', async () => {
    renderList();
    showColumn('userList.overview.emailQuality');

    expect(
      within(await rowOf('Reader')).getByText(
        'userList.overview.emailSegments.dead'
      )
    ).toBeInTheDocument();
    expect(
      within(await rowOf('Staff')).getByText(
        'userList.overview.emailSegments.unknown'
      )
    ).toBeInTheDocument();
  });

  it('shows since when in its own column, empty without a level', async () => {
    renderList();
    showColumn('userList.overview.emailQualitySince');

    const cellUnder = (row: HTMLElement) =>
      within(row).getAllByRole('cell')[
        headers().indexOf('userList.overview.emailQualitySince')
      ];

    expect(cellUnder(await rowOf('Reader')).textContent).toBe(
      'userList.overview.emailQualitySinceDate'
    );
    expect(cellUnder(await rowOf('Staff')).textContent).toBe('');
  });

  it.each([
    ['userList.overview.emailQuality', UserSort.EmailQuality],
    ['userList.overview.emailQualitySince', UserSort.EmailQualitySince],
  ])('sorts by %s', async (label, sort) => {
    renderList();
    showColumn(label);

    fireEvent.click(screen.getByRole('button', { name: label }));

    const listCalls = mockedUseQuery.mock.calls.filter(
      ([document]) => document === TinyUserListDocument
    );

    expect(listCalls.at(-1)?.[1]).toEqual(
      expect.objectContaining({
        variables: expect.objectContaining({ sort }),
      })
    );
  });

  it('offers the email segments as a filter', async () => {
    renderList();
    fireEvent.click(
      screen.getByRole('button', { name: 'filterableList.filter.label' })
    );

    expect(
      await screen.findByRole('combobox', {
        name: 'userList.overview.emailQuality',
      })
    ).toBeInTheDocument();
  });
});
