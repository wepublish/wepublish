import '@testing-library/jest-dom/vitest';

import { useLazyQuery, useMutation } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import { WebsiteAnalytics } from './website-analytics';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useLazyQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

const mockedUseLazyQuery = useLazyQuery as unknown as Mock;
const mockedUseMutation = useMutation as unknown as Mock;

const theme = createTheme({ cssVariables: true });

const off = { enabled: false, key: '' };
const umamiId = '4f4c5ea1-0000-4000-8000-000000000000';

const renderPage = (umami: Record<string, unknown>) => {
  const analytics = {
    googleAnalytics: off,
    googleTagManager: off,
    plausible: off,
    piwik: off,
    umami,
  };
  const updateWebsiteSettings = vi.fn();

  mockedUseLazyQuery.mockReturnValue([
    vi.fn().mockResolvedValue({ data: { websiteSettings: { analytics } } }),
    { loading: false },
  ]);
  mockedUseMutation.mockReturnValue([
    updateWebsiteSettings,
    { loading: false },
  ]);

  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <WebsiteAnalytics />
      </MemoryRouter>
    </ThemeProvider>
  );

  return updateWebsiteSettings;
};

const save = async (updateWebsiteSettings: Mock) => {
  fireEvent.click(screen.getByRole('button', { name: 'save' }));
  await waitFor(() => expect(updateWebsiteSettings).toHaveBeenCalled());

  return updateWebsiteSettings.mock.calls[0][0].variables.analytics.umami;
};

const advanced = () =>
  screen.findByRole('button', {
    name: 'websiteSettings.analytics.umami.advanced',
  });

describe('WebsiteAnalytics', () => {
  it('hides the advanced Umami settings while Umami is off', async () => {
    renderPage({ ...off, excludedSearchParams: [] });

    await screen.findByRole('button', { name: 'save' });

    expect(
      screen.queryByRole('button', {
        name: 'websiteSettings.analytics.umami.advanced',
      })
    ).not.toBeInTheDocument();
  });

  it('keeps the advanced Umami settings collapsed and saves no params by default', async () => {
    const updateWebsiteSettings = renderPage({
      enabled: true,
      key: umamiId,
      excludedSearchParams: [],
    });

    expect(await advanced()).toHaveAttribute('aria-expanded', 'false');

    expect(await save(updateWebsiteSettings)).toEqual({
      enabled: true,
      key: umamiId,
      excludedSearchParams: [],
    });
  });

  it('edits the search params Umami must not receive', async () => {
    const updateWebsiteSettings = renderPage({
      enabled: true,
      key: umamiId,
      excludedSearchParams: ['mail', 'lastName'],
    });

    fireEvent.click(await advanced());

    const label = 'websiteSettings.analytics.umami.excludedSearchParam';
    expect(
      screen
        .getAllByLabelText(label)
        .map(input => (input as HTMLInputElement).value)
    ).toEqual(['mail', 'lastName']);

    fireEvent.click(
      screen.getAllByRole('button', { name: 'delete' })[1] as HTMLElement
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'websiteSettings.analytics.umami.addExcludedSearchParam',
      })
    );
    fireEvent.change(screen.getAllByLabelText(label)[1], {
      target: { value: ' firstName ' },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'websiteSettings.analytics.umami.addExcludedSearchParam',
      })
    );

    expect(await save(updateWebsiteSettings)).toEqual({
      enabled: true,
      key: umamiId,
      excludedSearchParams: ['mail', 'firstName'],
    });
  });
});
