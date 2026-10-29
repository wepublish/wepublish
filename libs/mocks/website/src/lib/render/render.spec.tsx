import { useQuery } from '@apollo/client/react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useUser } from '@wepublish/authentication/website';
import { theme } from '@wepublish/ui';
import { mockOperation } from '../apollo';
import { mockSessionWithoutUser } from '../session';
import { mockSensitiveDataUser } from '../user';
import {
  BuilderRouterContext,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { CheckLoginOtpDocument } from '@wepublish/website/api';
import { de } from 'date-fns/locale';
import { useRouter } from 'next/router';
import { ComponentProps, PropsWithChildren, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { renderWithProviders } from './render';
import { TEST_SCRIPT_TEST_ID } from './test-script';

const Session = () => {
  const { user, hasUser, setToken } = useUser();

  return (
    <>
      <p>{hasUser ? `logged in as ${user?.email}` : 'logged out'}</p>
      <button onClick={() => setToken(mockSessionWithoutUser())}>login</button>
      <button onClick={() => setToken(null)}>logout</button>
    </>
  );
};

describe('renderWithProviders', () => {
  it('renders logged out by default', () => {
    renderWithProviders(<Session />);

    expect(screen.getByText('logged out')).toBeInTheDocument();
  });

  it('renders the given user as logged in', () => {
    const user = mockSensitiveDataUser({ email: 'jane@example.com' });

    renderWithProviders(<Session />, { user });

    expect(
      screen.getByText('logged in as jane@example.com')
    ).toBeInTheDocument();
  });

  it('records token changes and updates the session', async () => {
    const user = userEvent.setup();
    const session = mockSessionWithoutUser();
    const { setToken } = renderWithProviders(<Session />);

    await user.click(screen.getByRole('button', { name: 'login' }));

    expect(setToken).toHaveBeenCalledWith(
      expect.objectContaining({ token: session.token })
    );
    expect(await screen.findByText(/^logged in as/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'logout' }));

    expect(setToken).toHaveBeenLastCalledWith(null);
    expect(await screen.findByText('logged out')).toBeInTheDocument();
  });

  it('answers Apollo operations from the given mocks', async () => {
    const Otp = () => {
      const { data } = useQuery(CheckLoginOtpDocument, {
        variables: { email: 'foo@bar.ch' },
      });

      return <p>{data ? `otp: ${data.checkLoginOtp}` : 'loading'}</p>;
    };

    renderWithProviders(<Otp />, {
      mocks: [
        mockOperation(CheckLoginOtpDocument, {
          variables: { email: 'foo@bar.ch' },
          data: { __typename: 'Query', checkLoginOtp: true },
        }),
      ],
    });

    expect(await screen.findByText('otp: true')).toBeInTheDocument();
  });

  it('provides the website builder with an inline Head and an offline Script', () => {
    const Embed = () => {
      const { Head, Script, elements } = useWebsiteBuilder();

      return (
        <>
          <Head>
            <title>Page title</title>
          </Head>
          <Script src="https://example.com/embed.js" />
          <elements.Button>Click</elements.Button>
        </>
      );
    };

    renderWithProviders(<Embed />);

    expect(document.querySelector('title')).toHaveTextContent('Page title');
    expect(screen.getByTestId(TEST_SCRIPT_TEST_ID)).toHaveAttribute(
      'data-src',
      'https://example.com/embed.js'
    );
    expect(document.querySelector('script[src]')).toBeNull();
    expect(screen.getByRole('button', { name: 'Click' })).toBeInTheDocument();
  });

  it('lets a test override builder components', () => {
    const Navbar = () => <nav aria-label="custom navbar" />;
    const Probe = () => {
      const { Navbar: BuilderNavbar } = useWebsiteBuilder();

      return (
        <BuilderNavbar {...({} as ComponentProps<typeof BuilderNavbar>)} />
      );
    };

    renderWithProviders(<Probe />, { builder: { Navbar } });

    expect(
      screen.getByRole('navigation', { name: 'custom navbar' })
    ).toBeInTheDocument();
  });

  it('provides next/router and the builder router with the given route', async () => {
    const user = userEvent.setup();
    const Route = () => {
      const router = useRouter();
      const { query } = useContext(BuilderRouterContext);

      return (
        <>
          <p>
            {router.pathname} {String(query['slug'])}
          </p>
          <button onClick={() => router.push('/search')}>navigate</button>
        </>
      );
    };

    const { router } = renderWithProviders(<Route />, {
      router: { pathname: '/a/[slug]', query: { slug: 'foo' } },
    });

    expect(screen.getByText('/a/[slug] foo')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'navigate' }));

    expect(router.push).toHaveBeenCalledWith('/search');
  });

  it('renders German by default and French on request', () => {
    const Label = () => {
      const { t } = useTranslation();

      return <p>{t('navbar.myAccount')}</p>;
    };

    const { unmount } = renderWithProviders(<Label />);

    expect(screen.getByText('Mein Konto')).toBeInTheDocument();
    unmount();

    renderWithProviders(<Label />, { locale: 'fr' });

    expect(screen.getByText('Mon compte')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('fr');
  });

  it('wraps the tree in the tenant wrapper, theme and builder', () => {
    const Wrapper = ({ children }: PropsWithChildren) => (
      <main aria-label="tenant">{children}</main>
    );
    const Probe = () => {
      const { meta } = useWebsiteBuilder();

      return <p>{meta.siteTitle}</p>;
    };

    renderWithProviders(<Probe />, {
      tenant: {
        id: 'test',
        name: 'Test',
        createTheme: () => theme,
        builder: { meta: { siteTitle: 'Tenant title' } },
        translations: { lng: 'de' },
        dateLocale: de,
        Wrapper,
      },
    });

    expect(screen.getByRole('main', { name: 'tenant' })).toHaveTextContent(
      'Tenant title'
    );
  });

  it('starts every test in German again', () => {
    expect(document.documentElement.lang).toBe('de');
  });

  it('waits for rerenders with the same providers', async () => {
    const { rerender } = renderWithProviders(<Session />, {
      user: mockSensitiveDataUser({ email: 'jane@example.com' }),
    });

    rerender(<Session />);

    await waitFor(() =>
      expect(
        screen.getByText('logged in as jane@example.com')
      ).toBeInTheDocument()
    );
  });
});
