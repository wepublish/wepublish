import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { MailProviderSettingsDocument } from '@wepublish/editor/api';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { IntegrationEditView } from './integrationEditView';

const queryResults = new Map<unknown, unknown>();

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: (document: unknown) => ({
    data: queryResults.get(document),
    loading: false,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('./mailIntegrationForm', () => ({
  MailIntegrationForm: () => <div data-testid="mail-form" />,
}));

const renderView = (path: string) =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/integrations/:type"
            element={<IntegrationEditView />}
          />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

describe('IntegrationEditView', () => {
  beforeEach(() => {
    queryResults.clear();
  });

  it('says what the integration is for, in plain sight', () => {
    renderView('/integrations/mail');

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'integrations.mailProvider',
      })
    ).toBeInTheDocument();
    expect(screen.getByText('integrations.mailProviderInfo')).toBeVisible();
    expect(screen.getByTestId('mail-form')).toBeInTheDocument();
  });

  it('points to the integration it is easily confused with', () => {
    renderView('/integrations/mail');

    expect(
      screen.getByText('integrations.related.mailToMailchimpSync')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'integrations.mailchimpSync' })
    ).toHaveAttribute('href', '/integrations/mailchimp-sync');
  });

  it('shows whether the integration is ready', () => {
    queryResults.set(MailProviderSettingsDocument, {
      mailProviderSettings: [],
    });
    renderView('/integrations/mail');

    expect(
      screen.getByText('integrations.status.notSetUp')
    ).toBeInTheDocument();
  });

  it('says so when the integration does not exist', () => {
    renderView('/integrations/nope');

    expect(screen.getByText('integrations.notFound')).toBeInTheDocument();
  });
});
