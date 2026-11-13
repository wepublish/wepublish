import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  applyTenantTranslations,
  DEFAULT_TEST_VIEWPORT_WIDTH,
  mockExternalNavigationLink,
  mockNavigation,
  renderWithProviders,
  resetTranslations,
  setTestViewportWidth,
} from '@wepublish/mocks/website';
import i18next from 'i18next';

import { wepublishSiteTenant } from '../wepublish-site-tenant';
import { WepNavbar } from './wep-navbar';

const headerNavigation = mockNavigation({
  key: 'main-header-de',
  links: [
    mockExternalNavigationLink({ label: 'We.Start', url: '/de/start' }),
    mockExternalNavigationLink({ label: 'We.Develop', url: '/de/develop' }),
    mockExternalNavigationLink({ label: 'Über uns', url: '/de/ueber-uns' }),
    mockExternalNavigationLink({
      label: 'Demo buchen',
      url: 'mailto:info@wepublish.ch',
    }),
  ],
});

const renderNavbar = (locale = 'de') =>
  renderWithProviders(
    <WepNavbar
      data={{ __typename: 'Query', navigations: [headerNavigation] }}
      loading={false}
      slug="main-header-de"
      categorySlugs={[]}
      headerSlug="header-de"
      iconSlug="icons-de"
      hasRunningSubscription={false}
      hasUnpaidInvoices={false}
    />,
    { tenant: wepublishSiteTenant, router: { locale } }
  );

describe('WepNavbar', () => {
  beforeAll(() => applyTenantTranslations(wepublishSiteTenant));
  afterAll(() => resetTranslations());

  it('links the logo to the home page', () => {
    renderNavbar();

    expect(
      screen.getByRole('img', { name: 'WePublish Logo' }).closest('a')
    ).toHaveAttribute('href', '/');
  });

  // The test router leaves out the locale prefix that Next.js adds to the links
  const expectedLinks = [
    ['We.Start', expect.stringMatching(/\/start$/)],
    ['We.Develop', expect.stringMatching(/\/develop$/)],
    ['Über uns', expect.stringMatching(/\/ueber-uns$/)],
    ['Demo buchen', 'mailto:info@wepublish.ch'],
  ];

  const linksInNavbar = () =>
    expectedLinks.map(([name]) => [
      name,
      screen.queryByRole('link', { name })?.getAttribute('href'),
    ]);

  describe('on desktop', () => {
    beforeEach(() => setTestViewportWidth(1440));
    afterEach(() => setTestViewportWidth(DEFAULT_TEST_VIEWPORT_WIDTH));

    it('links every entry of the header navigation, the last one included', () => {
      renderNavbar();

      expect(linksInNavbar()).toEqual(expectedLinks);
    });

    it('needs no menu button', () => {
      renderNavbar();

      expect(
        screen.queryByRole('button', { name: i18next.t('navbar.openMenu') })
      ).not.toBeInTheDocument();
    });
  });

  describe('language switch', () => {
    it('shows the current language and keeps the others closed', () => {
      renderNavbar('fr');

      expect(screen.getByRole('button', { name: 'FR' })).toHaveAttribute(
        'aria-expanded',
        'false'
      );
      expect(
        screen.queryByRole('link', { name: 'DE' })
      ).not.toBeInTheDocument();
    });

    it('opens a list of all languages that link to their home page', async () => {
      renderNavbar('de');

      await userEvent.click(screen.getByRole('button', { name: 'DE' }));

      expect(screen.getByRole('button', { name: 'DE' })).toHaveAttribute(
        'aria-expanded',
        'true'
      );
      expect(screen.getByRole('link', { name: 'DE' })).toHaveAttribute(
        'aria-current',
        'true'
      );
      expect(screen.getByRole('link', { name: 'FR' })).toHaveAttribute(
        'href',
        '/fr'
      );
    });

    it('closes the list with escape', async () => {
      renderNavbar('de');

      await userEvent.click(screen.getByRole('button', { name: 'DE' }));
      await userEvent.keyboard('{Escape}');

      expect(
        screen.queryByRole('link', { name: 'FR' })
      ).not.toBeInTheDocument();
    });
  });

  // The default test screen (1024px) is narrower than the desktop breakpoint
  describe('mobile menu', () => {
    const openMenu = () =>
      screen.getByRole('button', { name: i18next.t('navbar.openMenu') });

    it('starts closed and hides the links', () => {
      renderNavbar();

      expect(openMenu()).toHaveAttribute('aria-expanded', 'false');
      expect(
        screen.queryByRole('link', { name: 'We.Start' })
      ).not.toBeInTheDocument();
    });

    it('shows every entry of the header navigation when open', async () => {
      renderNavbar();

      await userEvent.click(openMenu());

      expect(linksInNavbar()).toEqual(expectedLinks);
    });

    it('opens and closes again', async () => {
      renderNavbar();

      await userEvent.click(openMenu());

      const closeMenu = screen.getByRole('button', {
        name: i18next.t('navbar.closeMenu'),
      });
      expect(closeMenu).toHaveAttribute('aria-expanded', 'true');

      await userEvent.click(closeMenu);

      expect(openMenu()).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes with escape', async () => {
      renderNavbar();

      await userEvent.click(openMenu());
      await userEvent.keyboard('{Escape}');

      expect(openMenu()).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes when a link is chosen', async () => {
      renderNavbar();

      await userEvent.click(openMenu());
      await userEvent.click(screen.getByRole('link', { name: 'We.Develop' }));

      expect(openMenu()).toHaveAttribute('aria-expanded', 'false');
    });
  });
});
