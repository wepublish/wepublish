import { screen } from '@testing-library/react';
import {
  mockExternalNavigationLink,
  mockNavigation,
  mockNavigations,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { BuilderFooterProps } from '@wepublish/website/builder';
import { Footer } from './footer';

const wepublishUrl = 'https://wepublish.ch/de/das-projekt/#cms';

const navigations = [
  ...mockNavigations(),
  mockNavigation({
    key: 'icons',
    name: 'Social Media Icons',
    links: ['Instagram', 'Facebook'].map(label =>
      mockExternalNavigationLink({
        label,
        url: `https://${label.toLowerCase()}.com/foobar`,
      })
    ),
  }),
];

const renderFooter = (props: Partial<BuilderFooterProps> = {}) =>
  renderWithProviders(
    <Footer
      data={{ __typename: 'Query', navigations }}
      loading={false}
      slug="main"
      categorySlugs={[['categories', 'about']]}
      iconSlug="icons"
      wepublishLogo="light"
      {...props}
    />
  );

const link = (name: string) => screen.getByRole('link', { name });
const queryLink = (name: string) => screen.queryByRole('link', { name });
const wepublishLink = (container: HTMLElement) =>
  container.querySelector(`a[href="${wepublishUrl}"]`);

describe('Footer', () => {
  it('shows the main links, the categories with their names and the icons', () => {
    renderFooter();

    expect(link('Gesellschaft')).toHaveAttribute('href', '/gesellschaft');
    expect(link('Politik')).toHaveAttribute('href', '/a/politik');
    expect(link('Was lauft?')).toHaveAttribute(
      'href',
      'https://example.com/agenda'
    );
    expect(screen.getByText('Kategorien')).toBeInTheDocument();
    expect(screen.getByText('Über Uns')).toBeInTheDocument();
    expect(link('Mobilität')).toHaveAttribute('href', '/mobilitaet');
    expect(link('Team')).toHaveAttribute('href', '/team');
    expect(link('Instagram')).toHaveAttribute(
      'href',
      'https://instagram.com/foobar'
    );
    expect(link('Facebook')).toHaveAttribute(
      'href',
      'https://facebook.com/foobar'
    );
  });

  it('groups the category navigations as configured', () => {
    renderFooter({ categorySlugs: [['categories'], ['about']] });

    const kategorien = screen.getByText('Kategorien');
    const ueberUns = screen.getByText('Über Uns');

    expect(kategorien.parentElement?.parentElement).not.toBe(
      ueberUns.parentElement?.parentElement
    );
  });

  it('puts category navigations of one group together', () => {
    renderFooter({ categorySlugs: [['categories', 'about']] });

    expect(screen.getByText('Kategorien').parentElement?.parentElement).toBe(
      screen.getByText('Über Uns').parentElement?.parentElement
    );
  });

  it('skips category slugs that have no navigation', () => {
    renderFooter({ categorySlugs: [['unknown', 'about']] });

    expect(screen.queryByText('Kategorien')).not.toBeInTheDocument();
    expect(link('Team')).toBeInTheDocument();
  });

  it('shows only the icons without main and category navigations', () => {
    renderFooter({ slug: '', categorySlugs: [] });

    expect(queryLink('Gesellschaft')).not.toBeInTheDocument();
    expect(queryLink('Team')).not.toBeInTheDocument();
    expect(link('Instagram')).toBeInTheDocument();
  });

  it('links the light We.Publish logo by default', () => {
    const { container } = renderFooter();

    const logo = wepublishLink(container);

    expect(logo).toBeInTheDocument();
    expect(logo?.querySelector('path[fill="black"]')).toBeInTheDocument();
  });

  it('links the dark We.Publish logo', () => {
    const { container } = renderFooter({ wepublishLogo: 'dark' });

    const logo = wepublishLink(container);

    expect(logo).toBeInTheDocument();
    expect(logo?.querySelector('path[fill="#fff"]')).toBeInTheDocument();
  });

  it('hides the We.Publish logo', () => {
    const { container } = renderFooter({ wepublishLogo: 'hidden' });

    expect(wepublishLink(container)).not.toBeInTheDocument();
    expect(link('Instagram')).toBeInTheDocument();
  });

  it('renders no icon bar without icons and without the logo', () => {
    const { container } = renderFooter({
      iconSlug: '',
      wepublishLogo: 'hidden',
    });

    expect(queryLink('Instagram')).not.toBeInTheDocument();
    expect(container.querySelectorAll('footer > div')).toHaveLength(1);
  });

  it('shows the children below the navigations', () => {
    renderFooter({ children: <p>Impressum</p> });

    expect(screen.getByText('Impressum')).toBeInTheDocument();
  });
});
