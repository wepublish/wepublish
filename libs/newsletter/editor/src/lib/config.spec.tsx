import { render, screen } from '@testing-library/react';
import type { ComponentConfig } from '@puckeditor/core';
import type { FullImageFragment } from '@wepublish/editor/api';
import type { TFunction } from 'i18next';
import { rememberArticles } from './articles';
import { createConfig } from './config';
import { rememberImages } from './images';

const t = ((key: string) => key) as unknown as TFunction;

const draw = (type: string, props: Record<string, unknown>) => {
  const component = createConfig([], t).components[type] as ComponentConfig;

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
