import { render, screen } from '@testing-library/react';
import type { ComponentConfig, RadioField } from '@puckeditor/core';
import type { FullImageFragment } from '@wepublish/editor/api';
import { getKit } from '@wepublish/newsletter/email';
import type { KitId } from '@wepublish/newsletter/email';
import type { TFunction } from 'i18next';
import type { ReactElement } from 'react';
import { rememberArticles } from './articles';
import { createConfig } from './config';
import { rememberImages } from './images';

const t = ((key: string, options?: { size?: string }) =>
  options?.size ? `${key} (${options.size})` : key) as unknown as TFunction;

const configFor = (kit: KitId) => createConfig(getKit(kit), [], t);

const draw = (
  type: string,
  props: Record<string, unknown>,
  kit: KitId = 'eenews'
) => {
  const component = configFor(kit).components[type] as ComponentConfig;

  return render(
    <>{component.render({ id: 'block', puck: {}, ...props } as never)}</>
  );
};

describe('canvas', () => {
  beforeAll(() => {
    rememberImages([
      {
        id: 'logo',
        url: 'https://media.example.com/logo',
      } as FullImageFragment,
    ]);
    rememberArticles([
      {
        id: 'article-1',
        title: 'Solar im Winter',
        lead: 'Lead',
        url: 'https://example.com/a/solar',
        preTitle: null,
        imageUrl: null,
        publishedAt: '2026-10-01T00:00:00.000Z',
        tags: [],
      },
    ]);
  });

  it('asks for an image where none is picked yet', () => {
    draw('image', { imageId: '', alt: 'Logo' });

    expect(screen.getByText('newsletter.editor.pickImage')).toBeTruthy();
  });

  it('draws the picked image from the image cache', () => {
    const { container } = draw('image', { imageId: 'logo', alt: 'Logo' });

    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      'https://media.example.com/logo'
    );
  });

  it('draws a teaser from the article cache', () => {
    draw('teaser', {
      variant: 'short',
      article: { id: 'article-1', title: 'Solar im Winter' },
    });

    expect(screen.getByText('Solar im Winter')).toBeTruthy();
  });

  it('names a teaser whose article is gone', () => {
    draw('teaser', {
      variant: 'short',
      article: { id: 'gone', title: 'gone' },
    });

    expect(
      screen.getByText(/Artikel konnte nicht geladen werden \(gone\)/)
    ).toBeTruthy();
  });
});

describe('root', () => {
  it('has no page fields — neither the preview text nor Puck’s own title', () => {
    // Left undefined, Puck falls back to a `title` field of its own.
    expect(configFor('eenews').root?.fields).toEqual({});
  });
});

describe('kits', () => {
  it('offers eenews every block', () => {
    expect(Object.keys(configFor('eenews').components).sort()).toEqual(
      [...getKit('eenews').blocks].sort()
    );
  });

  it('offers bajour only its blocks, and no category left empty', () => {
    const config = configFor('bajour');

    expect(Object.keys(config.components).sort()).toEqual(
      [...getKit('bajour').blocks].sort()
    );

    for (const category of Object.values(config.categories ?? {})) {
      expect(category.components?.length).toBeGreaterThan(0);

      for (const component of category.components ?? []) {
        expect(config.components).toHaveProperty(component);
      }
    }
  });

  it('offers bajour its two Einzüge, labelled with its own widths', () => {
    const gutter = configFor('bajour').components.text.fields
      ?.gutter as RadioField;

    expect(gutter.options).toEqual([
      { label: 'newsletter.blocks.gutter.article (18px)', value: 'article' },
      { label: 'newsletter.blocks.gutter.none (0px)', value: 'none' },
    ]);
    expect(configFor('bajour').components.heading.defaultProps).toMatchObject({
      gutter: 'article',
    });
  });

  it('draws the canvas in the kit’s theme', () => {
    const { container } = draw('heading', { text: 'Titel' }, 'bajour');

    expect(container.querySelector('h2')?.getAttribute('style')).toContain(
      'Georgia'
    );
  });

  it('sets the canvas column to the kit’s width', () => {
    const root = configFor('bajour').root?.render?.({
      children: null,
      puck: {},
    } as never);
    const { container } = render(root as ReactElement);

    expect(container.querySelector('div')?.getAttribute('style')).toContain(
      'width: 600px'
    );
  });
});
