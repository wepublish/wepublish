import '@testing-library/jest-dom/vitest';

import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { AudienceDashboard } from './audience-dashboard';

const theme = createTheme({ cssVariables: true });

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: () => ({ data: undefined, loading: false }),
  useLazyQuery: () => [vi.fn(), { data: undefined, loading: false }],
  useMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const renderDashboard = () =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <AudienceDashboard />
      </MemoryRouter>
    </ThemeProvider>
  );

describe('AudienceDashboard', () => {
  it('offers the download beside the title', () => {
    renderDashboard();

    const title = screen.getByRole('heading', {
      name: 'audienceDashboard.title',
    });
    const download = screen.getByRole('button', {
      name: /audienceTableExport.download/,
    });

    expect(title.parentElement?.parentElement).toBe(
      download.closest('[class*="ListViewContainer"]')
    );
  });
});
