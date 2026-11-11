import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Mock } from 'vitest';

import { ExternalAppIframeView } from './externalAppIframeView';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const renderView = () =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MemoryRouter initialEntries={['/external-app/app-1']}>
        <Routes>
          <Route
            path="/external-app/:id"
            element={<ExternalAppIframeView />}
          />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

describe('ExternalAppIframeView', () => {
  it('titles the page after the app it shows', () => {
    mockedUseQuery.mockReturnValue({
      loading: false,
      data: {
        externalApp: { id: 'app-1', name: 'Ginto', url: 'about:blank' },
      },
    });
    renderView();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Ginto' })
    ).toBeInTheDocument();
  });

  it('explains a missing app in words instead of a database error', () => {
    mockedUseQuery.mockReturnValue({
      loading: false,
      data: undefined,
      error: new Error(
        'Invalid `this.prisma.externalApps.findMany()` invocation'
      ),
    });
    renderView();

    expect(
      screen.getByRole('heading', { level: 1, name: 'externalApps.notFound' })
    ).toBeInTheDocument();
    expect(screen.queryByText(/prisma/)).toBeNull();
  });
});
