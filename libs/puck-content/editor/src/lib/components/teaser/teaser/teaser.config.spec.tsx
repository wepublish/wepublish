import { PuckContext, SlotComponent } from '@puckeditor/core';
import { screen } from '@testing-library/react';
import {
  mockArticle,
  mockArticleRevision,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  emptyPuckBlockData,
  PuckBlockData,
} from '@wepublish/puck-content/website';
import { ComponentType, createElement, ReactNode } from 'react';

import { PuckBlockDataContext } from '../../../block-data/puck-block-data.context';
import { dataComponents } from '../../data/data.blocks';
import { TeaserConfig } from './teaser.config';

const Teaser = dataComponents.Teaser;

const article = mockArticle({
  url: 'https://example.com/a/first-story',
  latest: mockArticleRevision({ title: 'First story', blocks: [] }),
});

const puck = (isEditing: boolean): PuckContext => ({
  renderDropZone: () => null,
  isEditing,
  dragRef: null,
  metadata: {},
});

const contentSlot = (children: ReactNode = 'Teaser parts') =>
  vi.fn<SlotComponent>(props => (
    <div
      data-testid="content"
      data-min-empty-height={props?.minEmptyHeight}
      className={props?.className}
    >
      {children}
    </div>
  ));

const renderTeaser = ({
  isEditing = true,
  data = { ...emptyPuckBlockData, articles: [article] },
  content = contentSlot(),
  props = {},
}: {
  isEditing?: boolean;
  data?: PuckBlockData;
  content?: SlotComponent;
  props?: Record<string, unknown>;
} = {}) =>
  renderWithProviders(
    <PuckBlockDataContext.Provider value={new Map([['Teaser-1', data]])}>
      {createElement(Teaser.render as ComponentType<Record<string, unknown>>, {
        ...Teaser.defaultProps,
        id: 'Teaser-1',
        puck: puck(isEditing),
        ...props,
        content,
      })}
    </PuckBlockDataContext.Provider>
  );

const placeholder =
  'No record yet. Pick one, or place this teaser in a block that lists records.';

describe('TeaserConfig', () => {
  it('is called Teaser', () => {
    expect(TeaserConfig.label).toBe('Teaser');
    expect(TeaserConfig.ai?.instructions).toEqual(expect.any(String));
  });

  it('links to its record unless switched off', () => {
    expect(TeaserConfig.fields?.linkToRecord).toMatchObject({
      type: 'switch',
      label: 'Link to record',
      ai: { instructions: expect.any(String) },
    });
    expect(TeaserConfig.defaultProps?.linkToRecord).toBe(true);
  });

  it('starts with an image, a pre-title, a title and a lead inside', () => {
    expect(
      (TeaserConfig.defaultProps?.content ?? []).map(({ type }) => type)
    ).toEqual(['TeaserImage', 'TeaserPreTitle', 'TeaserTitle', 'TeaserLead']);
  });

  it('takes the teaser parts, layout blocks and buttons into its content, never another teaser', () => {
    const content = TeaserConfig.fields?.content;
    const allowed = content?.type === 'slot' ? (content.allow ?? []) : [];

    expect(allowed).toEqual(
      expect.arrayContaining([
        'TeaserImage',
        'TeaserPreTitle',
        'TeaserTitle',
        'TeaserLead',
        'TeaserAuthors',
        'TeaserDate',
        'TeaserTags',
        'Space',
        'Grid',
        'DynamicGrid',
        'Row',
        'Slider',
        'Container',
        'Collapsible',
        'Button',
      ])
    );
    expect(allowed).not.toContain('Teaser');
    expect(content?.type === 'slot' && content.disallow).toEqual(['Teaser']);
  });
});

describe('the Teaser block', () => {
  it('takes an article, page or event from its parent or as a pick', () => {
    expect(Teaser.fields?.datasources).toMatchObject({
      type: 'datasource',
      models: ['article', 'page', 'event'],
      types: ['slot', 'single'],
    });
    expect(Teaser.defaultProps?.datasources).toEqual({
      article: { type: 'slot' },
    });
  });

  it('has styling and visibility like the other blocks', () => {
    expect(Teaser.fields).toHaveProperty('styling.type', 'styling');
    expect(Teaser.fields).toHaveProperty('visibility.type', 'blockVisibility');
  });

  it('hands the record of its datasource to the teaser parts inside', () => {
    renderTeaser({
      content: contentSlot(
        createElement(
          dataComponents.TeaserTitle.render as ComponentType<
            Record<string, unknown>
          >,
          { id: 'TeaserTitle-1', puck: puck(true) }
        )
      ),
    });

    expect(screen.getByRole('heading', { name: 'First story' })).toBeTruthy();
  });

  it('never links in the canvas, so a click selects the block inside', () => {
    renderTeaser();

    expect(screen.getByTestId('content')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByText(placeholder)).toBeNull();
  });

  it('keeps its content editable and shows a hint while it has no record', () => {
    const { container } = renderTeaser({ data: emptyPuckBlockData });

    expect(container.firstElementChild?.tagName).toBe('ARTICLE');
    expect(screen.getByRole('status')).toHaveTextContent(placeholder);
    expect(container.firstElementChild).toContainElement(
      screen.getByTestId('content')
    );
  });

  it('keeps an empty content slot droppable', () => {
    renderTeaser();

    expect(screen.getByTestId('content')).toHaveAttribute(
      'data-min-empty-height',
      '120'
    );
  });

  it('renders like the website outside the editor', () => {
    const { container } = renderTeaser({ isEditing: false });
    const link = screen.getByRole('link');

    expect(link).toHaveAttribute('href', 'https://example.com/a/first-story');
    expect(container.firstElementChild?.firstElementChild).toBe(link);
    expect(link).not.toContainElement(screen.getByTestId('content'));
  });

  it('renders nothing outside the editor without a record', () => {
    const { container } = renderTeaser({
      isEditing: false,
      data: emptyPuckBlockData,
    });

    expect(container.childElementCount).toBe(0);
  });
});
