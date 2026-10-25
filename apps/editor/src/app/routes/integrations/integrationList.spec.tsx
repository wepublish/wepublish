import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { CanGetAISettings } from '@wepublish/permissions';
import { AuthContext } from '@wepublish/ui/editor';
import { MemoryRouter } from 'react-router-dom';

import { IntegrationList } from './integrationList';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const renderList = () =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <AuthContext.Provider
        value={
          {
            session: {
              sessionRoles: [
                { id: 'role', permissions: [{ id: CanGetAISettings.id }] },
              ],
            },
          } as never
        }
      >
        <MemoryRouter>
          <IntegrationList />
        </MemoryRouter>
      </AuthContext.Provider>
    </ThemeProvider>
  );

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
});
