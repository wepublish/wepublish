import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockPaywall,
  mockRichTextParagraph,
  mockSensitiveDataUser,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { BuilderPaywallProps } from '@wepublish/website/builder';
import { t } from 'i18next';
import { Paywall } from './paywall';

const paywall = mockPaywall({
  description: mockRichTextParagraph('Dieser Artikel ist nur für Abonnenten.'),
  circumventDescription: mockRichTextParagraph(
    'Unterstütze uns und lies weiter.'
  ),
});

const renderPaywall = (
  props: Partial<BuilderPaywallProps> = {},
  options: Parameters<typeof renderWithProviders>[1] = {}
) =>
  renderWithProviders(
    <Paywall
      {...paywall}
      {...props}
    />,
    options
  );

const link = (name: string) => screen.getByRole('link', { name });

describe('Paywall', () => {
  afterEach(() => {
    document.cookie =
      'auth.intended=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.history.replaceState(null, '', '/');
  });

  it('shows the circumvent description and offers subscribing or logging in', () => {
    renderPaywall();

    expect(
      screen.getByText('Unterstütze uns und lies weiter.')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Dieser Artikel ist nur für Abonnenten.')
    ).not.toBeInTheDocument();
    expect(link(t('paywall.subscribe'))).toHaveAttribute('href', '/mitmachen');
    expect(link(t('paywall.login'))).toHaveAttribute('href', '/login');
  });

  it('shows the description when the content is hidden', () => {
    renderPaywall({ hideContent: true });

    expect(
      screen.getByText('Dieser Artikel ist nur für Abonnenten.')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Unterstütze uns und lies weiter.')
    ).not.toBeInTheDocument();
  });

  it('falls back to the description without a circumvent description', () => {
    renderPaywall({ circumventDescription: null });

    expect(
      screen.getByText('Dieser Artikel ist nur für Abonnenten.')
    ).toBeInTheDocument();
  });

  it('does not offer the login to a logged in reader', () => {
    renderPaywall({}, { user: mockSensitiveDataUser() });

    expect(link(t('paywall.subscribe'))).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: t('paywall.login') })
    ).not.toBeInTheDocument();
  });

  it('uses the custom texts', () => {
    renderPaywall({
      texts: { subscribe: 'Jetzt abonnieren', login: 'Anmelden' },
    });

    expect(link('Jetzt abonnieren')).toHaveAttribute('href', '/mitmachen');
    expect(link('Anmelden')).toHaveAttribute('href', '/login');
  });

  it('links to the alternative subscribe url', () => {
    renderPaywall({ alternativeSubscribeUrl: 'https://example.com/abo' });

    expect(link(t('paywall.subscribe'))).toHaveAttribute(
      'href',
      'https://example.com/abo'
    );
  });

  it.each([['paywall.subscribe'], ['paywall.login']])(
    'remembers the article when %s is clicked',
    async key => {
      const user = userEvent.setup();
      window.history.replaceState(null, '', '/a/paid-article');
      renderPaywall();

      const target = link(t(key));
      target.addEventListener('click', event => event.preventDefault());
      await user.click(target);

      expect(document.cookie).toContain(
        `auth.intended=${encodeURIComponent('/a/paid-article')}`
      );
    }
  );
});
