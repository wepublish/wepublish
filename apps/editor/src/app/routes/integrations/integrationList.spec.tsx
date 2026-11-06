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

const renderList = ({
  permissions = [CanGetAISettings.id],
  features = [],
}: { permissions?: string[]; features?: string[] } = {}) => {
  featuresQuery.mockReturnValue({ data: { features }, loading: false });

  return render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <AuthContext.Provider
        value={
          {
            session: {
              email: 'karl@wepublish.ch',
              sessionToken: 't',
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

const letterPermissions = [
  CanGetMailProviderSettings.id,
  CanGetLetterProviderSettings.id,
  CanGetPdfRendererSettings.id,
];

describe('IntegrationList', () => {
  it('titles the page and each integration as headings', () => {
    renderList();

    expect(
      screen.getByRole('heading', { level: 1, name: /integrations.title/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /integrations.ai/ })
    ).toBeInTheDocument();
  });

  it('ties each edit link to the integration it opens', () => {
    renderList();

    expect(
      screen.getByRole('link', { name: 'edit' })
    ).toHaveAccessibleDescription('integrations.ai');
  });

  it('names the supported providers', () => {
    renderList();

    expect(screen.getByRole('img', { name: 'Vercel' })).toBeInTheDocument();
  });

  it('hides the letter integrations while paper letters are off', () => {
    renderList({ permissions: letterPermissions });

    expect(screen.getByText('integrations.mailProvider')).toBeTruthy();
    expect(screen.queryByText('integrations.letterProvider')).toBeNull();
    expect(screen.queryByText('integrations.pdfRenderer')).toBeNull();
  });

  it('shows them once the medium has the feature', () => {
    renderList({ permissions: letterPermissions, features: ['paper-letters'] });

    expect(screen.getByText('integrations.letterProvider')).toBeTruthy();
    expect(screen.getByText('integrations.pdfRenderer')).toBeTruthy();
  });
});
