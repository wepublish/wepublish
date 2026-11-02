import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockArticleNavigationLink,
  mockExternalNavigationLink,
  mockImage,
  mockNavigation,
  mockNavigations,
  mockPageNavigationLink,
  mockSensitiveDataUser,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { t } from 'i18next';
import { ComponentProps } from 'react';
import { Navbar } from './navbar';

const navigations = [
  ...mockNavigations(),
  mockNavigation({
    key: 'header',
    name: 'Header',
    links: [
      mockPageNavigationLink({
        label: 'Agenda',
        page: { __typename: 'Page', url: '/agenda' },
      }),
      mockArticleNavigationLink({
        label: 'Dossier',
        article: { __typename: 'Article', url: '/a/dossier' },
      }),
    ],
  }),
  mockNavigation({
    key: 'icons',
    name: 'Icons',
    links: [
      mockExternalNavigationLink({
        label: 'Instagram',
        url: 'https://instagram.com/foobar',
      }),
    ],
  }),
];

const renderNavbar = (
  props: Partial<ComponentProps<typeof Navbar>> = {},
  options: Parameters<typeof renderWithProviders>[1] = {}
) => {
  const onMenuToggle = vi.fn();

  const result = renderWithProviders(
    <Navbar
      data={{ __typename: 'Query', navigations }}
      loading={false}
      slug="main"
      categorySlugs={[['categories'], ['about']]}
      headerSlug="header"
      iconSlug="icons"
      logo={mockImage()}
      hasUnpaidInvoices={false}
      hasRunningSubscription={false}
      onMenuToggle={onMenuToggle}
      {...props}
    />,
    options
  );

  return { ...result, onMenuToggle };
};

const link = (name: string | RegExp) => screen.getByRole('link', { name });
const queryLink = (name: string | RegExp) =>
  screen.queryByRole('link', { name });
const menuButton = () => screen.getByRole('button', { name: 'Menu' });

describe('Navbar', () => {
  it('opens the menu with the main and category links and closes it again', async () => {
    const user = userEvent.setup();
    const { onMenuToggle } = renderNavbar();

    expect(queryLink('Gesellschaft')).not.toBeInTheDocument();

    await user.click(menuButton());

    expect(link('Gesellschaft')).toHaveAttribute('href', '/gesellschaft');
    expect(link('Mobilität')).toHaveAttribute('href', '/mobilitaet');
    expect(link('Team')).toHaveAttribute('href', '/team');
    expect(screen.getByText('Kategorien')).toBeInTheDocument();
    expect(screen.getByText('Über Uns')).toBeInTheDocument();
    expect(onMenuToggle).toHaveBeenLastCalledWith(true);

    await user.click(menuButton());

    expect(queryLink('Gesellschaft')).not.toBeInTheDocument();
    expect(onMenuToggle).toHaveBeenLastCalledWith(false);
  });

  it('closes the menu when a menu link is clicked', async () => {
    const user = userEvent.setup();
    const { onMenuToggle } = renderNavbar();

    await user.click(menuButton());
    await user.click(link('Mobilität'));

    expect(queryLink('Mobilität')).not.toBeInTheDocument();
    expect(onMenuToggle).toHaveBeenLastCalledWith(false);
  });

  it('closes the menu when an icon link is clicked', async () => {
    const user = userEvent.setup();
    const { onMenuToggle } = renderNavbar();

    await user.click(menuButton());

    const iconLink = link('Instagram');
    expect(iconLink).toHaveAttribute('href', 'https://instagram.com/foobar');

    await user.click(iconLink);

    expect(queryLink('Gesellschaft')).not.toBeInTheDocument();
    expect(onMenuToggle).toHaveBeenLastCalledWith(false);
  });

  it('only reports the toggle when the menu state is controlled', async () => {
    const user = userEvent.setup();
    const { onMenuToggle } = renderNavbar({ isMenuOpen: true });

    await user.click(menuButton());

    expect(onMenuToggle).toHaveBeenCalledWith(false);
    expect(link('Gesellschaft')).toBeInTheDocument();
  });

  it('shows the header links and the subscribe link in the bar', () => {
    renderNavbar();

    expect(link('Agenda')).toHaveAttribute('href', '/agenda');
    expect(link('Dossier')).toHaveAttribute('href', '/a/dossier');
    expect(link(t('navbar.subscribe'))).toHaveAttribute('href', '/mitmachen');
  });

  it('links the logo to the start page', () => {
    renderNavbar();

    const home = link('Startseite');

    expect(home).toHaveAttribute('href', '/');
    expect(home.querySelector('img')).toBeInTheDocument();
  });

  it('renders no logo image without a logo', () => {
    renderNavbar({ logo: undefined });

    expect(link('Startseite').querySelector('img')).not.toBeInTheDocument();
  });

  it('offers the login but no logout when logged out', () => {
    renderNavbar({ isMenuOpen: true });

    expect(link(t('navbar.login'))).toHaveAttribute('href', '/login');
    expect(
      screen.queryByRole('button', { name: t('navbar.logout') })
    ).not.toBeInTheDocument();
    expect(queryLink(t('navbar.myAccount'))).not.toBeInTheDocument();
  });

  it('logs out and closes the menu', async () => {
    const user = userEvent.setup();
    const { onMenuToggle, setToken } = renderNavbar(
      { isMenuOpen: true },
      { user: mockSensitiveDataUser() }
    );

    expect(link(t('navbar.myAccount'))).toHaveAttribute('href', '/profile');
    expect(queryLink(t('navbar.login'))).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: t('navbar.logout') }));

    expect(setToken).toHaveBeenCalledWith(null);
    expect(onMenuToggle).toHaveBeenCalledWith(false);
  });

  it('links to the account instead of the subscription with a running subscription', () => {
    renderNavbar(
      { hasRunningSubscription: true },
      { user: mockSensitiveDataUser() }
    );

    expect(link(t('navbar.myAccount'))).toHaveAttribute('href', '/profile');
    expect(queryLink(t('navbar.subscribe'))).not.toBeInTheDocument();
  });

  it('warns about an unpaid invoice instead of the account link', () => {
    renderNavbar(
      { hasUnpaidInvoices: true, hasRunningSubscription: true },
      { user: mockSensitiveDataUser() }
    );

    expect(link(new RegExp(t('navbar.invoice')))).toHaveAttribute(
      'href',
      '/profile'
    );
    expect(queryLink(t('navbar.myAccount'))).not.toBeInTheDocument();
    expect(queryLink(t('navbar.subscribe'))).not.toBeInTheDocument();
  });

  it('uses the configured button links in the bar and in the menu', () => {
    renderNavbar({
      isMenuOpen: true,
      loginBtn: { href: '/anmelden' },
      subscribeBtn: { href: '/abo' },
    });

    expect(link(t('navbar.login'))).toHaveAttribute('href', '/anmelden');

    const subscribeLinks = screen.getAllByRole('link', {
      name: t('navbar.subscribe'),
    });
    expect(subscribeLinks).toHaveLength(2);
    subscribeLinks.forEach(subscribeLink =>
      expect(subscribeLink).toHaveAttribute('href', '/abo')
    );
  });

  it('hides a button that is configured as null', () => {
    renderNavbar({ isMenuOpen: true, loginBtn: null, subscribeBtn: null });

    expect(queryLink(t('navbar.login'))).not.toBeInTheDocument();
    expect(queryLink(t('navbar.subscribe'))).not.toBeInTheDocument();
  });

  it('shows the children inside the open menu', () => {
    renderNavbar({
      isMenuOpen: true,
      children: <button type="button">Darkmode</button>,
    });

    expect(
      screen.getByRole('button', { name: 'Darkmode' })
    ).toBeInTheDocument();
  });

  it('keeps the closed menu in the page, inert, when it has a custom class', () => {
    const { container } = renderNavbar({
      navPaperClassName: 'custom-nav-paper',
    });

    const paper = container.querySelector('.custom-nav-paper');

    expect(paper).toBeInTheDocument();
    expect(paper).toHaveAttribute('inert');
    expect(paper).not.toHaveClass('menu-open');
  });

  it('marks the custom menu as open when the menu is opened', async () => {
    const user = userEvent.setup();
    const { container } = renderNavbar({
      navPaperClassName: 'custom-nav-paper',
    });

    await user.click(menuButton());

    const paper = container.querySelector('.custom-nav-paper');
    expect(paper).toHaveClass('menu-open');
    expect(paper).not.toHaveAttribute('inert');
  });

  it('renders no menu when there are no navigations for it', async () => {
    const user = userEvent.setup();
    renderNavbar({ slug: '', categorySlugs: [], headerSlug: '' });

    await user.click(menuButton());

    expect(queryLink('Gesellschaft')).not.toBeInTheDocument();
    expect(queryLink(t('navbar.login'))).not.toBeInTheDocument();
  });

  it('hides the menu button and the subscribe link with hideMenu', () => {
    renderNavbar({ hideMenu: true });

    expect(
      screen.queryByRole('button', { name: 'Menu' })
    ).not.toBeInTheDocument();
    expect(queryLink('Agenda')).not.toBeInTheDocument();
    expect(queryLink(t('navbar.subscribe'))).not.toBeInTheDocument();
  });
});

describe('Navbar while the account is being set up', () => {
  const renderMenu = (accountSetupPending: boolean) =>
    renderNavbar(
      {
        isMenuOpen: true,
        hasRunningSubscription: true,
        hasUnpaidInvoices: true,
        accountSetupPending,
      },
      { user: mockSensitiveDataUser() }
    );

  const linksNamed = (name: string) =>
    screen
      .queryAllByRole('link')
      .filter(link => link.textContent?.includes(name));

  it('hides the account, which cannot be used before the setup', () => {
    renderMenu(true);

    expect(linksNamed(t('navbar.myAccount'))).toHaveLength(0);
  });

  it('does not mention unpaid invoices before the setup', () => {
    renderMenu(true);

    expect(linksNamed(t('navbar.unpaid'))).toHaveLength(0);
  });

  it('keeps logging out possible', () => {
    renderMenu(true);

    expect(
      screen.getByRole('button', { name: t('navbar.logout') })
    ).toBeInTheDocument();
  });

  it('keeps the usual account buttons otherwise', () => {
    renderMenu(false);

    expect(linksNamed(t('navbar.myAccount')).length).toBeGreaterThan(0);
    expect(linksNamed(t('navbar.unpaid')).length).toBeGreaterThan(0);
  });
});
