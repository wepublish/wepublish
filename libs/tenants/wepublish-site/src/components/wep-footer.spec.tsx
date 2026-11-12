import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  applyTenantTranslations,
  mockExternalNavigationLink,
  mockNavigation,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';

import { wepublishSiteTenant } from '../wepublish-site-tenant';
import { WepFooter } from './wep-footer';

const group = (key: string, name: string, links: [string, string][]) =>
  mockNavigation({
    key,
    name,
    links: links.map(([label, url]) =>
      mockExternalNavigationLink({ label, url })
    ),
  });

const navigations = [
  group('footer-services-de', 'Services', [
    ['We.Start', '/de/start'],
    ['We.Develop', '/de/develop'],
  ]),
  group('footer-network-de', 'Netzwerk', [['Events', '/de/events']]),
  group('footer-contact-de', 'Kontakt', [
    ['Kontakt', '/de/kontakt'],
    ['Impressum', '/de/impressum'],
  ]),
  group('footer-icons-de', 'Icons', [
    ['LinkedIn', 'https://www.linkedin.com/company/wepublish'],
    ['E-Mail', 'mailto:info@wepublish.ch'],
    ['GitHub', 'https://github.com/wepublish'],
  ]),
  group('some-other-navigation', 'Andere', [['Nicht im Footer', '/nein']]),
];

const renderFooter = () =>
  renderWithProviders(
    <WepFooter
      data={{ __typename: 'Query', navigations }}
      loading={false}
      slug="footer-services-de"
      categorySlugs={[
        ['footer-network-de', 'footer-missing-de', 'footer-contact-de'],
      ]}
      iconSlug="footer-icons-de"
      wepublishLogo="light"
    />,
    { tenant: wepublishSiteTenant, router: { locale: 'de' } }
  );

describe('WepFooter', () => {
  beforeAll(() => applyTenantTranslations(wepublishSiteTenant));
  afterAll(() => resetTranslations());

  it('shows the address of the foundation', () => {
    renderFooter();

    expect(
      screen.getByText(/We\.Publish Foundation/).innerHTML.split('<br>')
    ).toEqual(['We.Publish Foundation', 'Friedensgasse 52', '4056 Basel']);
  });

  it('shows one group per navigation, titled with the name of the navigation', () => {
    renderFooter();

    expect(
      screen.getAllByRole('heading').map(heading => heading.textContent)
    ).toEqual(['Services', 'Netzwerk', 'Kontakt']);
  });

  it('links the entries of each group', () => {
    renderFooter();

    const services = screen.getByRole('region', { name: 'Services' });

    expect(
      within(services)
        .getAllByRole('link')
        .map(link => [link.textContent, link.getAttribute('href')])
    ).toEqual([
      ['We.Start', expect.stringMatching(/\/start$/)],
      ['We.Develop', expect.stringMatching(/\/develop$/)],
    ]);
    expect(
      screen.queryByRole('link', { name: 'Nicht im Footer' })
    ).not.toBeInTheDocument();
  });

  it('shows the icon links in the last group', () => {
    renderFooter();

    const contact = screen.getByRole('region', { name: 'Kontakt' });

    expect(
      within(contact).getByRole('link', { name: 'LinkedIn' })
    ).toHaveAttribute('href', 'https://www.linkedin.com/company/wepublish');
    expect(
      within(contact).getByRole('link', { name: 'E-Mail' })
    ).toHaveAttribute('href', 'mailto:info@wepublish.ch');
    expect(
      within(contact).getByRole('link', { name: 'GitHub' })
    ).toHaveAttribute('href', 'https://github.com/wepublish');
  });

  it('lets the reader switch the language', async () => {
    renderFooter();

    await userEvent.click(screen.getByRole('button', { name: 'DE' }));

    expect(screen.getByRole('link', { name: 'FR' })).toHaveAttribute(
      'href',
      '/fr'
    );
  });
});
