import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Mock } from 'vitest';

import { UserRoleList } from './userRoleList';

const theme = createTheme({ cssVariables: true });

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  createCheckedPermissionComponent: () => (component: unknown) => component,
  PermissionControl: ({ children }: { children: ReactNode }) => children,
  UserRoleEditPanel: ({
    id,
    onClose,
  }: {
    id?: string;
    onClose: () => void;
  }) => (
    <button
      type="button"
      onClick={onClose}
    >
      {`close ${id ?? 'new'}`}
    </button>
  ),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const renderAt = (path: string) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          {['/userroles', '/userroles/create', '/userroles/edit/:id'].map(
            route => (
              <Route
                key={route}
                path={route}
                element={<UserRoleList />}
              />
            )
          )}
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

beforeEach(() => {
  localStorage.clear();
  mockedUseQuery.mockReset();
  mockedUseQuery.mockReturnValue({
    data: {
      userRoles: {
        nodes: [
          {
            id: 'role-1',
            name: 'Editor',
            description: 'Edits articles',
            systemRole: false,
            permissions: [],
          },
        ],
        totalCount: 1,
      },
    },
    loading: false,
    refetch: vi.fn(),
  });
});

describe('UserRoleList', () => {
  it('opens the edit drawer again for a role that was just closed', async () => {
    renderAt('/userroles/edit/role-1');

    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'close role-1',
      })
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    fireEvent.click(screen.getByRole('link', { name: 'Editor' }));

    expect(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'close role-1',
      })
    ).toBeInTheDocument();
  });
});
