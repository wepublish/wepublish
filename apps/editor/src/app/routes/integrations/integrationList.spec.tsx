import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import {
  CanGetAISettings,
  CanGetLetterProviderSettings,
  CanGetMailProviderSettings,
  CanGetPdfRendererSettings,
} from '@wepublish/permissions';
import { AuthContext, FeaturesProvider } from '@wepublish/ui/editor';
import { MemoryRouter } from 'react-router-dom';

import { IntegrationList } from './integrationList';

const featuresQuery = vi.fn();

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: (_document: unknown, options?: unknown) => featuresQuery(options),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const renderWith = (
  features: string[],
  permissions = [
    CanGetMailProviderSettings.id,
    CanGetLetterProviderSettings.id,
    CanGetPdfRendererSettings.id,
  ]
) => {
  featuresQuery.mockReturnValue({ data: { features }, loading: false });

  return render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <AuthContext.Provider
        value={
          {
            session: {
              sessionRoles: [
                { id: 'role', permissions: permissions.map(id => ({ id })) },
              ],
            },
          } as never
        }
      >
        <FeaturesProvider>
          <MemoryRouter>
            <IntegrationList />
          </MemoryRouter>
        </FeaturesProvider>
      </AuthContext.Provider>
    </ThemeProvider>
  );
};

describe('IntegrationList', () => {
  it('hides the letter integrations while paper letters are off', () => {
    renderWith([]);

    expect(screen.getByText('integrations.mailProvider')).toBeTruthy();
    expect(screen.queryByText('integrations.letterProvider')).toBeNull();
    expect(screen.queryByText('integrations.pdfRenderer')).toBeNull();
  });

  it('shows them once the medium has the feature', () => {
    renderWith(['paper-letters']);

    expect(screen.getByText('integrations.letterProvider')).toBeTruthy();
    expect(screen.getByText('integrations.pdfRenderer')).toBeTruthy();
  });

  it('titles the page and each integration as headings', () => {
    renderWith([], [CanGetAISettings.id]);

    expect(
      screen.getByRole('heading', { level: 1, name: /integrations.title/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /integrations.ai/ })
    ).toBeInTheDocument();
  });

  it('ties each edit link to the integration it opens', () => {
    renderWith([], [CanGetAISettings.id]);

    expect(
      screen.getByRole('link', { name: 'edit' })
    ).toHaveAccessibleDescription('integrations.ai');
  });

  it('names the supported providers', () => {
    renderWith([], [CanGetAISettings.id]);

    expect(screen.getByRole('img', { name: 'Vercel' })).toBeInTheDocument();
  });
});
