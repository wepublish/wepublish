import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { ComponentType, PropsWithChildren } from 'react';

import { ProfilePage } from './profile-page';

const query = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));

vi.mock('../auth-guard', () => ({
  withAuthGuard: (Cmp: ComponentType) => Cmp,
}));

vi.mock('../router-hooks', () => ({
  useQueryParams: () => query.current,
}));

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<object>()),
  useQuery: () => ({ data: undefined }),
}));

vi.mock('@wepublish/membership/website', async importOriginal => ({
  ...(await importOriginal<object>()),
  useHasUnpaidInvoices: () => false,
  SubscriptionListContainer: () => null,
  InvoiceListContainer: () => null,
}));

vi.mock('@wepublish/user/website', async importOriginal => ({
  ...(await importOriginal<object>()),
  PersonalDataFormContainer: () => null,
  TotpSetupContainer: () => null,
}));

vi.mock('@wepublish/website/builder', async importOriginal => ({
  ...(await importOriginal<object>()),
  useWebsiteBuilder: () => ({
    elements: {
      H4: ({ children }: PropsWithChildren) => <h4>{children}</h4>,
      Alert: ({ children }: PropsWithChildren) => (
        <div role="alert">{children}</div>
      ),
    },
  }),
  Link: () => null,
  Button: () => null,
}));

// The real one renders the builder's wrapper, which is empty without a
// `WebsiteBuilderProvider`.
vi.mock('@wepublish/content/website', async importOriginal => ({
  ...(await importOriginal<object>()),
  ContentWrapper: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));

// Without an initialised i18n instance `useTranslation` suspends.
vi.mock('react-i18next', async importOriginal => ({
  ...(await importOriginal<object>()),
  useTranslation: () => ({ t: (key: string) => key }),
}));

const renderPage = () =>
  render(
    <ThemeProvider theme={createTheme()}>
      <ProfilePage />
    </ThemeProvider>
  );

describe('ProfilePage', () => {
  // The confirmation link opens the confirm-email page, which confirms the
  // token and sends the reader here with `?emailConfirmed=1`.
  it('says the new email address is confirmed after the confirmation link', () => {
    query.current = { emailConfirmed: '1' };
    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'user.emailChangeConfirmed'
    );
  });

  it('says nothing about the email address otherwise', () => {
    query.current = {};
    renderPage();

    expect(screen.queryByRole('alert')).toBeNull();
  });
});
