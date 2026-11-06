import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
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
  it('names the delete button after its navigation', () => {
    renderAt('/navigations');

    expect(
      screen.getByRole('button', { name: 'delete Main' })
    ).toBeInTheDocument();
  });
});
