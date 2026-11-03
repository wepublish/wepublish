import { screen } from '@testing-library/react';
import { renderWithProviders } from '@wepublish/mocks/website';

import { DocumentLayout } from './document-layout.component';

vi.mock('@wepublish/navigation/website', async importOriginal => {
  const { createElement } = await import('react');

  return {
    ...(await importOriginal<object>()),
    NavbarContainer: () => createElement('nav', { 'aria-label': 'Navbar' }),
    FooterContainer: () => createElement('footer', { 'aria-label': 'Footer' }),
  };
});

const content = <main aria-label="Content" />;

describe('DocumentLayout', () => {
  it('renders the content between the navigation and the footer', () => {
    renderWithProviders(<DocumentLayout>{content}</DocumentLayout>);

    const navbar = screen.getByRole('navigation', { name: 'Navbar' });
    const main = screen.getByRole('main', { name: 'Content' });
    const footer = screen.getByRole('contentinfo', { name: 'Footer' });

    expect(navbar.compareDocumentPosition(main)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(main.compareDocumentPosition(footer)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it('hides the navigation and the footer when switched off', () => {
    renderWithProviders(
      <DocumentLayout
        showNavigation={false}
        showFooter={false}
      >
        {content}
      </DocumentLayout>
    );

    expect(screen.getByRole('main', { name: 'Content' })).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Navbar' })).toBeNull();
    expect(screen.queryByRole('contentinfo', { name: 'Footer' })).toBeNull();
  });

  it('renders the navigation and the footer it is given instead', () => {
    renderWithProviders(
      <DocumentLayout
        navigation={<nav aria-label="Preview navbar" />}
        footer={<footer aria-label="Preview footer" />}
      >
        {content}
      </DocumentLayout>
    );

    expect(
      screen.getByRole('navigation', { name: 'Preview navbar' })
    ).toBeTruthy();
    expect(
      screen.getByRole('contentinfo', { name: 'Preview footer' })
    ).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Navbar' })).toBeNull();
    expect(screen.queryByRole('contentinfo', { name: 'Footer' })).toBeNull();
  });

  it('keeps the website navigation and footer interactive', () => {
    renderWithProviders(<DocumentLayout>{content}</DocumentLayout>);

    expect(
      window.getComputedStyle(
        screen.getByRole('navigation', { name: 'Navbar' })
      ).pointerEvents
    ).not.toBe('none');
  });
});
