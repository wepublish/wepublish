import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { AuthContext, FeaturesProvider } from '@wepublish/ui/editor';
import { MemoryRouter } from 'react-router-dom';

import { IntegrationList } from './integrationList';

const featuresQuery = vi.fn();

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: (_document: unknown, options?: unknown) => featuresQuery(options),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  PermissionControl: ({ children }: { children?: React.ReactNode }) => children,
  InfoTooltip: () => null,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const session = { session: { email: 'karl@wepublish.ch', sessionToken: 't' } };

const renderWith = (features: string[]) => {
  featuresQuery.mockReturnValue({ data: { features }, loading: false });

  return render(
    <ThemeProvider theme={createTheme()}>
      <AuthContext.Provider value={session}>
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
});
