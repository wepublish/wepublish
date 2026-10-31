import { PuckContext } from '@puckeditor/core';
import { renderWithProviders } from '@wepublish/mocks/website';
import { useTeaserSlot } from '@wepublish/puck-content/website';
import { screen } from '@testing-library/react';

import { ArticleRoot } from './article-root.component';
import { PageRoot } from './page-root.component';

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

const TeaserProbe = () => (
  <output aria-label="Teaser">
    {useTeaserSlot() === null ? 'none' : 'teaser'}
  </output>
);

const metaContent = (selector: string) =>
  document.querySelector(selector)?.getAttribute('content');

const isInteractive = (element: HTMLElement) =>
  window.getComputedStyle(element).pointerEvents !== 'none';

describe('PageRoot', () => {
  it('keeps the navigation and the footer out of reach while editing', () => {
    renderWithProviders(
      <PageRoot
        id="root"
        puck={puck}
      >
        {content}
      </PageRoot>
    );

    expect(
      isInteractive(screen.getByRole('navigation', { name: 'Navbar' }))
    ).toBe(false);
    expect(
      isInteractive(screen.getByRole('contentinfo', { name: 'Footer' }))
    ).toBe(false);
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

describe.each([
  ['PageRoot', PageRoot],
  ['ArticleRoot', ArticleRoot],
] as const)('%s', (_name, Root) => {
  it('provides no teaser to blocks outside a datasource', () => {
    renderWithProviders(
      <Root
        id="root"
        puck={puck}
      >
        <TeaserProbe />
      </Root>
    );

    expect(screen.getByRole('status', { name: 'Teaser' }).textContent).toBe(
      'none'
    );
  });
});

describe('ArticleRoot', () => {
  it('keeps the navigation and the footer out of reach while editing', () => {
    renderWithProviders(
      <ArticleRoot
        id="root"
        puck={puck}
      >
        {content}
      </ArticleRoot>
    );

    expect(screen.getByRole('main', { name: 'Content' })).toBeTruthy();
    expect(
      isInteractive(screen.getByRole('navigation', { name: 'Navbar' }))
    ).toBe(false);
    expect(
      isInteractive(screen.getByRole('contentinfo', { name: 'Footer' }))
    ).toBe(false);
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
