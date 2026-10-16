import '@testing-library/jest-dom/vitest';

import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen, within } from '@testing-library/react';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { WebsiteSettingsHeader } from './website-settings-header';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const theme = createTheme({ cssVariables: true });

const renderHeader = (ui: ReactNode) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>{ui}</MemoryRouter>
    </ThemeProvider>
  );

describe('WebsiteSettingsHeader', () => {
  it('names the page and leads back to the overview', () => {
    renderHeader(<WebsiteSettingsHeader title="Ads" />);

    expect(
      screen.getByRole('heading', { name: 'Ads', level: 1 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'websiteSettings.backToOverview' })
    ).toHaveAttribute('href', '/settings/website');
  });

  it('keeps the page actions in the header', () => {
    renderHeader(
      <WebsiteSettingsHeader title="Ads">
        <button aria-label="Save" />
      </WebsiteSettingsHeader>
    );

    const header = screen.getByRole('banner');

    expect(
      within(header).getByRole('button', { name: 'Save' })
    ).toBeInTheDocument();
  });
});
