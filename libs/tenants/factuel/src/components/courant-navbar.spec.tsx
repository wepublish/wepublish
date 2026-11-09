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

import { CourantNavbar } from './courant-navbar';

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
  Component: ComponentType<ComponentProps<typeof Navbar>>,
  overrides: Partial<ComponentProps<typeof Navbar>> = {}
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
      {...overrides}
    />
  );

describe('CourantNavbar', () => {
  it('renders the custom logo, menu toggle and subscribe action', () => {
    renderNavbar(CourantNavbar);

    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Courant' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: t('navbar.subscribe') })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Agenda' })).toHaveAttribute(
      'href',
      'https://example.com/agenda'
    );
  });

  it('shows the unpaid-invoice action pointing to the profile when invoices are open', () => {
    renderNavbar(CourantNavbar, { hasUnpaidInvoices: true });

    const invoiceLink = screen.getByRole('link', {
      name: new RegExp(t('navbar.invoice')),
    });
    expect(invoiceLink).toHaveAttribute('href', '/profile');
    expect(
      screen.queryByRole('link', { name: t('navbar.subscribe') })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: t('navbar.myAccount') })
    ).not.toBeInTheDocument();
  });
});
