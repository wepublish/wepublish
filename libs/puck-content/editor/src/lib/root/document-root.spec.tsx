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
});

describe.each([
  ['PageRoot', PageRoot],
  ['ArticleRoot', ArticleRoot],
] as const)('%s', (_name, Root) => {
  it('provides no teaser slot, so a teaser part outside a teaser fails loudly', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    expect(() =>
      renderWithProviders(
        <Root
          id="root"
          puck={puck}
        >
          <TeaserProbe />
        </Root>
      )
    ).toThrow('useTeaserSlot must be used within');

    consoleError.mockRestore();
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
});
