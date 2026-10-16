import '@testing-library/jest-dom/vitest';

import { useLazyQuery, useMutation } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import { WebsiteTheme } from './website-theme';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: () => ({ data: undefined, loading: false }),
  useLazyQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

const mockedUseLazyQuery = useLazyQuery as unknown as Mock;
const mockedUseMutation = useMutation as unknown as Mock;

const theme = createTheme({ cssVariables: true });

const renderPage = () =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <WebsiteTheme />
      </MemoryRouter>
    </ThemeProvider>
  );

beforeEach(() => {
  mockedUseLazyQuery.mockReset();
  mockedUseLazyQuery.mockReturnValue([
    vi.fn().mockResolvedValue({
      data: { websiteSettings: { theme: {}, fonts: [] } },
    }),
    { data: { websiteSettings: { theme: {}, fonts: [] } }, loading: false },
  ]);
  mockedUseMutation.mockReset();
  mockedUseMutation.mockReturnValue([vi.fn(), { loading: false }]);
});

describe('WebsiteTheme', () => {
  it('says which settings page this is', () => {
    renderPage();

    expect(
      screen.getByRole('heading', { name: 'websiteSettings.theme.title' })
    ).toBeInTheDocument();
  });

  it('keeps saving, exporting and importing together in the header', () => {
    renderPage();

    const header = screen
      .getByRole('heading', { name: 'websiteSettings.theme.title' })
      .closest('header') as HTMLElement;

    expect(
      within(header).getByRole('link', { name: /backToOverview/ })
    ).toBeInTheDocument();
    expect(
      within(header).getByRole('button', { name: 'save' })
    ).toBeInTheDocument();
    expect(
      within(header).getByRole('button', {
        name: 'websiteSettings.theme.exportTheme',
      })
    ).toBeInTheDocument();
    expect(
      within(header).getByRole('button', {
        name: 'websiteSettings.theme.importTheme',
      })
    ).toBeInTheDocument();
  });
});
