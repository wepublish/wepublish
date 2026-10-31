import { PuckContext } from '@puckeditor/core';
import { renderWithProviders } from '@wepublish/mocks/website';
import { screen } from '@testing-library/react';

import { ArticleRoot } from './article/article-root.component';
import { PageRoot } from './page/page-root.component';

vi.mock('@wepublish/navigation/website', async importOriginal => {
  const { createElement } = await import('react');

  return {
    ...(await importOriginal<object>()),
    NavbarContainer: () => createElement('nav', { 'aria-label': 'Navbar' }),
    FooterContainer: () => createElement('footer', { 'aria-label': 'Footer' }),
  };
});

const puck: PuckContext = {
  renderDropZone: () => null,
  isEditing: true,
  dragRef: null,
  metadata: {},
};

const content = <main aria-label="Content" />;

const metaContent = (selector: string) =>
  document.querySelector(selector)?.getAttribute('content');

describe('PageRoot', () => {
  it('renders the content between the navigation and the footer', () => {
    renderWithProviders(
      <PageRoot
        id="root"
        puck={puck}
      >
        {content}
      </PageRoot>
    );

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
      <PageRoot
        id="root"
        puck={puck}
        showNavigation={false}
        showFooter={false}
      >
        {content}
      </PageRoot>
    );

    expect(screen.getByRole('main', { name: 'Content' })).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Navbar' })).toBeNull();
    expect(screen.queryByRole('contentinfo', { name: 'Footer' })).toBeNull();
  });

  it('is shared as a website', () => {
    renderWithProviders(
      <PageRoot
        id="root"
        puck={puck}
        title="About us"
      >
        {content}
      </PageRoot>
    );

    expect(metaContent('meta[property="og:type"]')).toBe('website');
    expect(metaContent('meta[property="og:title"]')).toBe('About us');
  });
});

describe('ArticleRoot', () => {
  it('renders the content between the navigation and the footer', () => {
    renderWithProviders(
      <ArticleRoot
        id="root"
        puck={puck}
      >
        {content}
      </ArticleRoot>
    );

    expect(screen.getByRole('navigation', { name: 'Navbar' })).toBeTruthy();
    expect(screen.getByRole('main', { name: 'Content' })).toBeTruthy();
    expect(screen.getByRole('contentinfo', { name: 'Footer' })).toBeTruthy();
  });

  it('is shared as an article with its canonical URL', () => {
    renderWithProviders(
      <ArticleRoot
        id="root"
        puck={puck}
        title="Breaking"
        canonicalUrl="https://example.com/original"
      >
        {content}
      </ArticleRoot>
    );

    expect(metaContent('meta[property="og:type"]')).toBe('article');
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute('href')
    ).toBe('https://example.com/original');
  });
});
