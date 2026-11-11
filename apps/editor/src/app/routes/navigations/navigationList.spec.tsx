import { createTheme, ThemeProvider } from '@mui/material';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { NavigationList } from './navigationList';

const theme = createTheme({ cssVariables: true });

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: () => ({
    data: {
      navigations: [
        { id: 'navigation-1', key: 'main', name: 'Main', links: [] },
      ],
    },
    loading: false,
    refetch: vi.fn(),
  }),
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
  createCheckedPermissionComponent:
    () =>
    <T,>(component: T) =>
      component,
  PermissionControl: ({ children }: { children?: unknown }) => children,
  NavigationEditPanel: ({
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

const renderAt = (path: string) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          {['/navigations', '/navigations/create', '/navigations/edit/:id'].map(
            route => (
              <Route
                key={route}
                path={route}
                element={<NavigationList />}
              />
            )
          )}
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

beforeEach(() => {
  localStorage.clear();
});

describe('NavigationList', () => {
  it('opens the edit drawer again for a navigation that was just closed', async () => {
    renderAt('/navigations/edit/navigation-1');

    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'close navigation-1',
      })
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    fireEvent.click(screen.getByRole('link', { name: 'Main' }));

    expect(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'close navigation-1',
      })
    ).toBeInTheDocument();
  });

  it('keeps showing the closed navigation while the drawer slides out', () => {
    renderAt('/navigations/edit/navigation-1');

    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'close navigation-1',
      })
    );

    expect(
      screen.getByRole('button', { name: 'close navigation-1', hidden: true })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'close new', hidden: true })
    ).toBeNull();
  });

  it('names the delete button after its navigation', () => {
    renderAt('/navigations');

    expect(
      screen.getByRole('button', { name: 'delete Main' })
    ).toBeInTheDocument();
  });
});
