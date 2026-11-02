import { ComponentConfig, PuckContext } from '@puckeditor/core';
import { screen } from '@testing-library/react';
import {
  mockArticle,
  mockArticleRevision,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  TeaserSlotContext,
  TeaserSlotValue,
} from '@wepublish/puck-content/website';
import { ComponentType, createElement } from 'react';

import { TeaserAuthorsConfig } from './teaser-authors/teaser-authors.config';
import { TeaserDateConfig } from './teaser-date/teaser-date.config';
import { TeaserImageConfig } from './teaser-image/teaser-image.config';
import { TeaserLeadConfig } from './teaser-lead/teaser-lead.config';
import { TeaserPreTitleConfig } from './teaser-pre-title/teaser-pre-title.config';
import { TeaserTagsConfig } from './teaser-tags/teaser-tags.config';
import { TeaserTitleConfig } from './teaser-title/teaser-title.config';

const puck = (isEditing: boolean): PuckContext => ({
  renderDropZone: () => null,
  isEditing,
  dragRef: null,
  metadata: {},
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyConfig = ComponentConfig<any>;

const parts: [name: string, config: AnyConfig][] = [
  ['Teaser title', TeaserTitleConfig],
  ['Teaser pre-title', TeaserPreTitleConfig],
  ['Teaser lead', TeaserLeadConfig],
  ['Teaser image', TeaserImageConfig],
  ['Teaser authors', TeaserAuthorsConfig],
  ['Teaser date', TeaserDateConfig],
  ['Teaser tags', TeaserTagsConfig],
];

const emptyTeaser: TeaserSlotValue = {
  __typename: 'ArticleTeaser',
  title: null,
  preTitle: null,
  lead: null,
  image: null,
  imageID: null,
  articleID: 'empty',
  article: mockArticle({
    publishedAt: null as unknown as string,
    tags: [],
    latest: mockArticleRevision({
      title: '',
      preTitle: null,
      lead: null,
      image: null,
      authors: [],
      blocks: [],
    }),
  }),
} as TeaserSlotValue;

const renderPart = (
  config: AnyConfig,
  {
    isEditing = true,
    props = {},
    teaser = emptyTeaser,
  }: {
    isEditing?: boolean;
    props?: Record<string, unknown>;
    teaser?: TeaserSlotValue;
  } = {}
) =>
  renderWithProviders(
    <TeaserSlotContext.Provider value={teaser}>
      {createElement(config.render as ComponentType<Record<string, unknown>>, {
        ...config.defaultProps,
        ...props,
        id: 'Part-1',
        puck: puck(isEditing),
      })}
    </TeaserSlotContext.Provider>
  );

describe('teaser parts', () => {
  it.each(parts)(
    '%s hides itself when empty unless switched off',
    (_name, config) => {
      expect(config.fields?.hideWhenEmpty).toMatchObject({
        type: 'switch',
        label: 'Hide when empty',
        defaultValue: true,
        ai: { instructions: expect.any(String) },
      });
      expect(config.defaultProps?.hideWhenEmpty).toBe(true);
      expect(config.ai?.instructions).toContain('hideWhenEmpty');
    }
  );

  it.each(parts)(
    '%s stays selectable in the canvas while it is empty',
    (name, config) => {
      renderPart(config);

      expect(screen.getByRole('status').textContent).toBe(
        `${name} is empty and hidden on the website.`
      );
    }
  );

  it.each(parts)(
    '%s says that it keeps its space when empty parts are not hidden',
    (name, config) => {
      renderPart(config, { props: { hideWhenEmpty: false } });

      expect(screen.getByRole('status').textContent).toBe(
        `${name} is empty. The website keeps its space free.`
      );
    }
  );

  it.each(parts)(
    '%s renders like the website outside the editing canvas',
    (_name, config) => {
      const { container } = renderPart(config, { isEditing: false });

      expect(screen.queryByRole('status')).toBeNull();
      expect(container.childElementCount).toBe(0);
    }
  );

  it('shows the teaser value instead of the placeholder once there is one', () => {
    renderPart(TeaserTitleConfig, {
      teaser: {
        ...emptyTeaser,
        title: 'Filled title',
      } as TeaserSlotValue,
    });

    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByText('Filled title')).toBeTruthy();
  });

  it('lets the teaser image take a ratio and fit per breakpoint', () => {
    expect(TeaserImageConfig.fields?.fit).toMatchObject({
      type: 'breakpoints',
      objectFields: {
        aspectRatio: { type: 'aspectRatio' },
        objectFit: { type: 'objectFit' },
      },
      ai: { schema: expect.any(Object) },
    });
    expect(TeaserImageConfig.ai?.instructions).toContain('fit');
  });
});
