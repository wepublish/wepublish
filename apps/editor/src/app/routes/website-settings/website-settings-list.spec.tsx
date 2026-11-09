import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { CanGetAISettings } from '@wepublish/permissions';
import { AuthContext } from '@wepublish/ui/editor';
import { MemoryRouter } from 'react-router-dom';

import { WebsiteSettingsList } from './website-settings-list';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: () => ({
    loading: false,
    data: {
      websiteSettings: {
        analytics: {},
        mail: {},
        ads: {},
        fonts: [],
        theme: {
          palette: {
            primary: { main: '#000000' },
            secondary: { main: '#111111' },
            accent: { main: '#222222' },
            background: { default: '#ffffff' },
            text: { primary: '#333333' },
          },
        },
      },
    },
  }),
}));

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
          <WebsiteSettingsList />
        </MemoryRouter>
      </AuthContext.Provider>
    </ThemeProvider>
  );

describe('WebsiteSettingsList', () => {
  it('titles each settings card as a section heading', () => {
    renderList();

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'websiteSettings.analytics.title',
      })
    ).toBeInTheDocument();
  });

  it('ties each edit link to the card it opens', () => {
    renderList();

    const descriptions = screen
      .getAllByRole('link', { name: 'edit' })
      .map(link => link.getAttribute('aria-describedby'))
      .map(id => (id ? document.getElementById(id)?.textContent : null));

    expect(descriptions).toContain('websiteSettings.theme.title');
  });
});
