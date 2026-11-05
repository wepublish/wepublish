import { screen } from '@testing-library/react';
import {
  mockExternalNavigationLink,
  mockNavigation,
  mockNavigations,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { Navbar } from '@wepublish/navigation/website';
import { t } from 'i18next';
import { ComponentProps, ComponentType } from 'react';

import { FactuelNavbar } from './factuel-navbar';

const navigations = [
  ...mockNavigations(),
  mockNavigation({
    key: 'header',
    links: [
      mockExternalNavigationLink({
        label: 'Agenda',
        url: 'https://example.com/agenda',
      }),
    ],
  }),
];

const renderNavbar = (
  Component: ComponentType<ComponentProps<typeof Navbar>>
) =>
  renderWithProviders(
    <Component
      data={{ __typename: 'Query', navigations }}
      loading={false}
      slug="main"
      categorySlugs={[['categories', 'about']]}
      headerSlug="header"
      iconSlug="icons"
      hasRunningSubscription={false}
      hasUnpaidInvoices={false}
    />
  );

const menuButton = () => screen.queryByRole('button', { name: 'Menu' });
const headerLink = () => screen.queryByRole('link', { name: 'Agenda' });
const subscribeLink = () =>
  screen.queryByRole('link', { name: t('navbar.subscribe') });

describe('FactuelNavbar', () => {
  it('shows neither the menu, the header links nor the subscribe button', () => {
    const { unmount } = renderNavbar(Navbar);

    expect(menuButton()).toBeInTheDocument();
    expect(headerLink()).toHaveAttribute('href', 'https://example.com/agenda');
    expect(subscribeLink()).toBeInTheDocument();
    unmount();

    renderNavbar(FactuelNavbar);

    expect(menuButton()).not.toBeInTheDocument();
    expect(headerLink()).not.toBeInTheDocument();
    expect(subscribeLink()).not.toBeInTheDocument();
  });
});
